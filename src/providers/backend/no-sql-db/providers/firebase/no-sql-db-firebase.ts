/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  INoSqlDatabase,
  NoSqlDbPath,
  DocumentPath,
  NoSqlDbQueryConstraint,
  CollectionPath,
  JsonObject,
} from '@j2blasco/ts-crud';
import {
  Result,
  ErrorWithCode,
  resultError,
  resultSuccess,
  ErrorUnknown,
} from '@j2blasco/ts-result';
import { Subject } from 'rxjs';
import { getFirebaseAdminApp } from './firebase-init';
import {
  DocumentData,
  Firestore,
  Query,
  WithFieldValue,
} from 'firebase-admin/firestore';

function exhaustiveCheck(_value: never) {
  console.error('exhaustiveCheck failed with value:', _value);
}

export function createNoSqlDatabaseFirebase(): INoSqlDatabase {
  return new NoSqlDatabaseFirebase();
}

export class NoSqlDatabaseFirebase implements INoSqlDatabase {
  public readonly onWrite$ = new Subject<{
    path: NoSqlDbPath;
    before: unknown | null;
    after: unknown;
  }>();

  public readonly onDelete$ = new Subject<{
    path: NoSqlDbPath;
    before: unknown;
  }>();

  private readonly db: Firestore;

  constructor() {
    const adminApp = getFirebaseAdminApp();
    this.db = adminApp.firestore();
  }

  public readonly onBackup$ = new Subject<void>();

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  public async readDocument(
    path: DocumentPath,
  ): Promise<Result<any, ErrorWithCode<'not-found'>>> {
    const doc = await this.db.doc(path.join('/')).get();
    if (!doc.exists) {
      return resultError.withCode('not-found');
    }
    return resultSuccess(doc.data());
  }

  private processConstraints<T>(
    collection: Query<DocumentData>,
    constraints: NoSqlDbQueryConstraint<T>[],
  ): Query<DocumentData> {
    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'where':
          collection = collection.where(
            constraint.field as string,
            constraint.operator,
            constraint.value,
          );
          break;
        case 'limit':
          collection = collection.limit(constraint.value);
          break;
        case 'array-contains':
          collection = collection.where(
            constraint.field as string,
            'array-contains',
            constraint.value,
          );
          break;
        default:
          exhaustiveCheck(constraint);
          throw new Error(
            `Unsupported constraint type: ${JSON.stringify(constraint)}`,
          );
      }
    }
    return collection;
  }

  public async readCollection<T extends JsonObject = JsonObject>(args: {
    path: CollectionPath;
    constraints?: Array<NoSqlDbQueryConstraint<T>>;
  }): Promise<
    Result<
      Array<{ data: T; id: string }>,
      ErrorUnknown | ErrorWithCode<'not-found'>
    >
  > {
    try {
      const { path, constraints } = args;
      let collection = this.db.collection(
        path.join('/'),
      ) as Query<DocumentData>;
      if (constraints) {
        collection = this.processConstraints(collection, constraints);
      }
      const snapshot = await collection.get();
      const documents = snapshot.docs.map((doc) => ({
        data: doc.data() as T,
        id: doc.id,
      }));
      return resultSuccess(documents);
    } catch (e) {
      return resultError.unknown(this.toErrorMessage(e));
    }
  }

  public async addToCollection<T extends JsonObject = JsonObject>(
    path: CollectionPath,
    data: T,
  ): Promise<Result<{ id: string }, ErrorUnknown>> {
    try {
      const collection = this.db.collection(path.join('/'));
      // TODO: assert that data is WithFieldValue<DocumentData>
      const docRef = await collection.add(
        data as unknown as WithFieldValue<DocumentData>,
      );

      this.onWrite$.next({
        path: [...path, docRef.id],
        before: null,
        after: this.copyElement(data),
      });

      return resultSuccess({ id: docRef.id });
    } catch (e) {
      return resultError.unknown(this.toErrorMessage(e));
    }
  }

  public async writeDocument<T extends JsonObject = JsonObject>(
    path: DocumentPath,
    changes: T,
  ): Promise<Result<never, ErrorUnknown>> {
    try {
      const docRef = this.db.doc(path.join('/'));
      const docSnapshot = await docRef.get();
      const before = this.copyElement(
        docSnapshot.exists ? docSnapshot.data() : null,
      );
      await docRef.set(changes as unknown as WithFieldValue<DocumentData>, {
        merge: true,
      });
      this.onWrite$.next({
        path,
        before: before,
        after: {
          ...before,
          ...this.copyElement(changes),
        },
      });
      return resultSuccess(undefined as never);
    } catch (e) {
      return resultError.unknown(this.toErrorMessage(e));
    }
  }

  private copyElement(element: any): any {
    return JSON.parse(JSON.stringify(element));
  }

  public async deleteDocument(
    path: DocumentPath,
  ): Promise<Result<never, ErrorUnknown>> {
    try {
      const docRef = this.db.doc(path.join('/'));
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        return resultSuccess(undefined as never);
      }

      const documentsToDelete = await this.getAllDocumentsRecursively(docRef);

      const deleteBatch = documentsToDelete.map(async (doc) => {
        await this.db.doc(doc.path).delete();
        this.onDelete$.next({
          path: doc.path.split('/'),
          before: this.copyElement(doc.data),
        });
      });

      await Promise.all(deleteBatch);
      return resultSuccess(undefined as never);
    } catch (e) {
      return resultError.unknown(this.toErrorMessage(e));
    }
  }

  private async getAllDocumentsRecursively(
    docRef: FirebaseFirestore.DocumentReference,
  ): Promise<
    {
      id: string;
      data: FirebaseFirestore.DocumentData | undefined;
      path: string;
    }[]
  > {
    const documents: {
      id: string;
      data: FirebaseFirestore.DocumentData | undefined;
      path: string;
    }[] = [];

    // Retrieve the document itself if it exists
    const docSnapshot = await docRef.get();
    if (docSnapshot.exists) {
      documents.push({
        id: docSnapshot.id,
        data: docSnapshot.data(),
        path: docRef.path,
      });
    }

    // Retrieve all collections under this document
    const subcollections = await docRef.listCollections();
    for (const subcollection of subcollections) {
      const subcollectionSnapshot = await subcollection.get();
      for (const doc of subcollectionSnapshot.docs) {
        // Recursively retrieve documents within each subcollection
        const subDocuments = await this.getAllDocumentsRecursively(doc.ref);
        documents.push(...subDocuments);
      }
    }

    return documents;
  }

  public async deleteCollection(
    path: CollectionPath,
  ): Promise<Result<never, ErrorUnknown>> {
    try {
      const collectionRef = this.db.collection(path.join('/'));

      // Fetch all documents in the collection
      const snapshot = await collectionRef.get();

      // Batch delete documents in the collection
      const deletePromises = snapshot.docs.map(async (doc) => {
        // Get all documents recursively, including nested subcollections
        const documentsToDelete = await this.getAllDocumentsRecursively(
          doc.ref,
        );

        // Delete each document and emit deletion events
        for (const { id, data } of documentsToDelete) {
          this.onDelete$.next({
            path: [...path, id],
            before: this.copyElement(data),
          });
          await this.db.doc([...path, id].join('/')).delete();
        }

        // Delete the main document itself
        this.onDelete$.next({
          path: [...path, doc.id],
          before: this.copyElement(doc.data()),
        });
        await doc.ref.delete();
      });

      await Promise.all(deletePromises);
      return resultSuccess(undefined as never);
    } catch (e) {
      return resultError.unknown(this.toErrorMessage(e));
    }
  }
}

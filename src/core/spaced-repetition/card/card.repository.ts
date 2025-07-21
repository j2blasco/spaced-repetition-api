import {
  INoSqlDatabase,
  NoSqlDbQueryConstraint,
  CollectionPath,
  DocumentPath,
  JsonObject,
  JsonValue,
} from '@j2blasco/ts-crud';
import {
  Card,
  CreateCardRequest,
  DueCardsQuery,
  ICardRepository,
  UpdateCardRequest,
} from './card.interface';
import type { UserId } from 'src/core/user/user.interface';
import { AlgorithmType } from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';
import { ISpacedRepetition } from 'src/providers/spaced-repetition-algorithm/core/space-repetition.interface';
import {
  Result,
  resultSuccess,
  resultError,
  ErrorUnknown,
  ErrorWithCode,
  andThen,
  andThenAsync,
  catchError,
  resultSuccessVoid,
  SuccessVoid,
} from '@j2blasco/ts-result';
import { asyncPipe, pipe } from '@j2blasco/ts-pipe';

type CardSerialized = {
  userId: string;
  tags: string[];
  data: JsonObject;
  scheduling: {
    algorithmType: string;
    nextReviewDate: string;
    lastReviewDate: string | null;
    algorithmData: JsonObject;
  };
  createdAt: string;
  updatedAt: string;
};

export class CardRepository implements ICardRepository {
  private readonly COLLECTION_NAME = 'cards';

  constructor(
    private db: INoSqlDatabase,
    private spacedRepetition: ISpacedRepetition,
  ) {}

  async create(
    request: CreateCardRequest,
  ): Promise<Result<Card, ErrorUnknown>> {
    const now = new Date();
    const scheduler = this.spacedRepetition.getScheduler(request.algorithmType);
    const defaultScheduling = scheduler.initializeCard();

    // Serialize the scheduling data for storage
    const serializedScheduling =
      scheduler.serializeSchedulingData(defaultScheduling);

    // Convert to JsonObject-compatible format
    const cardData: JsonObject = {
      userId: request.userId,
      tags: [...(request.tags || [])], // Convert readonly array to mutable
      data: this.convertToJsonObject(request.data),
      scheduling: serializedScheduling,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const collectionPath: CollectionPath = [this.COLLECTION_NAME];
    const result = await this.db.addToCollection(collectionPath, cardData);

    return pipe(
      result,
      andThen((createdDocument: { id: string }) => {
        const card: Card = {
          id: createdDocument.id,
          userId: request.userId,
          tags: request.tags || [],
          data: request.data,
          scheduling: defaultScheduling,
          createdAt: now,
          updatedAt: now,
        };
        return resultSuccess(card);
      }),
    );
  }

  async findById(
    id: string,
  ): Promise<Result<Card, ErrorWithCode<'not-found'> | ErrorUnknown>> {
    const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
    const result = await this.db.readDocument(documentPath);

    return pipe(
      result,
      andThen((data) => {
        if (data === null) {
          return resultError.withCode('not-found' as const);
        }
        const card = this.deserializeCardData(data as CardSerialized, id);
        return resultSuccess(card);
      }),
    );
  }

  async findByUserId(
    userId: UserId,
  ): Promise<Result<readonly Card[], ErrorUnknown>> {
    const collectionPath: CollectionPath = [this.COLLECTION_NAME];
    const constraints: NoSqlDbQueryConstraint<CardSerialized>[] = [
      {
        type: 'where',
        field: 'userId',
        operator: '==',
        value: userId,
      },
    ];

    const result = await this.db.readCollection({
      path: collectionPath,
      constraints,
    });

    return pipe(
      result,
      catchError(() => {
        // Map any database errors (including not-found) to empty array for user queries
        return resultSuccess([] as readonly Card[]);
      }),
      andThen((data) => {
        if (Array.isArray(data)) {
          const cards = data.map((item) =>
            this.deserializeCardData(item.data, item.id),
          );
          return resultSuccess(cards as readonly Card[]);
        }
        return resultSuccess([] as readonly Card[]);
      }),
    );
  }

  async findByTags(
    userId: UserId,
    tags: readonly string[],
  ): Promise<Result<readonly Card[], ErrorUnknown>> {
    const collectionPath: CollectionPath = [this.COLLECTION_NAME];
    const constraints: NoSqlDbQueryConstraint<CardSerialized>[] = [
      {
        type: 'where',
        field: 'userId',
        operator: '==',
        value: userId,
      },
    ];

    // Add constraints for each tag using array-contains
    for (const tag of tags) {
      constraints.push({
        type: 'array-contains',
        field: 'tags',
        value: tag,
      });
    }

    const result = await this.db.readCollection({
      path: collectionPath,
      constraints,
    });

    return pipe(
      result,
      catchError(() => {
        // Map any database errors to empty array for user queries
        return resultSuccess([] as readonly Card[]);
      }),
      andThen((data) => {
        if (Array.isArray(data)) {
          const cards = data.map((item) =>
            this.deserializeCardData(item.data, item.id),
          );
          return resultSuccess(cards as readonly Card[]);
        }
        return resultSuccess([] as readonly Card[]);
      }),
    );
  }

  async findDueCards(
    query: DueCardsQuery,
  ): Promise<Result<readonly Card[], ErrorUnknown>> {
    const currentDate = query.currentDate || new Date();

    // For the testing database, we'll fetch all user cards and filter in memory
    // This works around the limitation that the NoSQL testing database doesn't
    // properly support nested field queries like 'scheduling.nextReviewDate'
    const userCardsResult = await this.findByUserId(query.userId);

    return pipe(
      userCardsResult,
      andThen((allCards) => {
        let dueCards = allCards.filter((card) => {
          // Check if card is due
          return card.scheduling.nextReviewDate <= currentDate;
        });

        // Filter by tags if specified
        if (query.tags && query.tags.length > 0) {
          dueCards = dueCards.filter((card) => {
            return query.tags!.some((tag) => card.tags.includes(tag));
          });
        }

        // Apply limit if specified
        if (query.limit && query.limit > 0) {
          dueCards = dueCards.slice(0, query.limit);
        }

        return resultSuccess(dueCards as readonly Card[]);
      }),
    );
  }

  async update(
    id: string,
    request: UpdateCardRequest,
  ): Promise<Result<Card, ErrorWithCode<'not-found'> | ErrorUnknown>> {
    const existingCardResult = await this.findById(id);

    return await asyncPipe(
      existingCardResult,
      andThenAsync(async (existingCard) => {
        // Prepare updated data
        const updatedTags =
          request.tags !== undefined ? request.tags : existingCard.tags;
        const updatedData =
          request.data !== undefined ? request.data : existingCard.data;
        const now = new Date();

        // Use the scheduler to serialize the scheduling data
        const scheduler = this.spacedRepetition.getScheduler(
          existingCard.scheduling.algorithmType,
        );
        const serializedScheduling = scheduler.serializeSchedulingData(
          existingCard.scheduling,
        );

        const dbData: JsonObject = {
          userId: existingCard.userId,
          tags: [...updatedTags],
          data: this.convertToJsonObject(updatedData),
          scheduling: serializedScheduling,
          createdAt: existingCard.createdAt.toISOString(),
          updatedAt: now.toISOString(),
        };

        const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
        const result = await this.db.writeDocument(documentPath, dbData);

        return pipe(
          result,
          andThen(() => {
            const updatedCard: Card = {
              id,
              userId: existingCard.userId,
              tags: updatedTags,
              data: updatedData,
              scheduling: existingCard.scheduling,
              createdAt: existingCard.createdAt,
              updatedAt: now,
            };
            return resultSuccess(updatedCard);
          }),
        );
      }),
    );
  }

  async delete(
    id: string,
  ): Promise<Result<SuccessVoid, ErrorWithCode<'not-found'> | ErrorUnknown>> {
    const existingCardResult = await this.findById(id);

    return await asyncPipe(
      existingCardResult,
      andThenAsync(async () => {
        const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
        const result = await this.db.deleteDocument(documentPath);
        return pipe(
          result,
          andThen(() => resultSuccessVoid()),
        );
      }),
    );
  }

  private deserializeCardData(dbData: CardSerialized, id: string): Card {
    // Get the appropriate scheduler for the algorithm type
    const algorithmType =
      (dbData.scheduling?.algorithmType as AlgorithmType) || AlgorithmType.SM2;
    const scheduler = this.spacedRepetition.getScheduler(algorithmType);

    // Deserialize the scheduling data using the scheduler
    const schedulingJsonObject = {
      algorithmType: dbData.scheduling?.algorithmType || AlgorithmType.SM2,
      nextReviewDate:
        dbData.scheduling?.nextReviewDate || new Date().toISOString(),
      lastReviewDate: dbData.scheduling?.lastReviewDate || null,
      algorithmData: dbData.scheduling?.algorithmData || {},
    };

    const scheduling =
      scheduler.deserializeSchedulingData(schedulingJsonObject);

    return {
      id,
      userId: dbData.userId || '',
      tags: Array.isArray(dbData.tags) ? dbData.tags : [],
      data: (dbData.data as Record<string, unknown>) || {},
      scheduling,
      createdAt: new Date(dbData.createdAt || new Date()),
      updatedAt: new Date(dbData.updatedAt || new Date()),
    };
  }

  private convertToJsonObject(obj: unknown): JsonObject {
    if (obj === null || obj === undefined) {
      return {};
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const result: JsonObject = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) {
          result[key] = null;
        } else if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          result[key] = this.convertToJsonObject(value);
        } else if (Array.isArray(value)) {
          result[key] = value.map((item) =>
            typeof item === 'object' && item !== null && !Array.isArray(item)
              ? this.convertToJsonObject(item)
              : item,
          );
        } else {
          result[key] = value as JsonValue;
        }
      }
      return result;
    }

    return obj as JsonObject;
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
      if (
        'data' in error &&
        typeof error.data === 'object' &&
        error.data !== null
      ) {
        if ('message' in error.data && typeof error.data.message === 'string') {
          return error.data.message;
        }
      }
    }
    return 'Unknown error';
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'not-found'
    );
  }
}

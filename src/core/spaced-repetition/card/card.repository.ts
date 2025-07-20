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

  async create(request: CreateCardRequest): Promise<Card> {
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

    const createdDocument = result.unwrapOrThrow((error) => {
      throw new Error(`Failed to create card: ${this.getErrorMessage(error)}`);
    });

    return {
      id: createdDocument.id,
      userId: request.userId,
      tags: request.tags || [],
      data: request.data,
      scheduling: defaultScheduling,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: string): Promise<Card | null> {
    const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
    const result = await this.db.readDocument(documentPath);

    try {
      const data = result.unwrapOrThrow((error) => {
        if (this.isNotFoundError(error)) {
          return null;
        }
        throw new Error(
          `Failed to find card by id: ${this.getErrorMessage(error)}`,
        );
      });

      if (data === null) {
        return null;
      }

      return this.deserializeCardData(data as CardSerialized, id);
    } catch (error) {
      if (error instanceof Error && error.message === 'not-found') {
        return null;
      }
      throw error;
    }
  }

  async findByUserId(userId: UserId): Promise<readonly Card[]> {
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

    try {
      const data = result.unwrapOrThrow((error) => {
        if (this.isNotFoundError(error)) {
          return [];
        }
        throw new Error(
          `Failed to find cards by user id: ${this.getErrorMessage(error)}`,
        );
      });

      if (Array.isArray(data)) {
        return data.map((item) => this.deserializeCardData(item.data, item.id));
      }
      return [];
    } catch (error) {
      if (error instanceof Error && error.message === 'not-found') {
        return [];
      }
      throw error;
    }
  }

  async findByTags(
    userId: UserId,
    tags: readonly string[],
  ): Promise<readonly Card[]> {
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

    try {
      const data = result.unwrapOrThrow((error) => {
        if (this.isNotFoundError(error)) {
          return [];
        }
        throw new Error(
          `Failed to find cards by tags: ${this.getErrorMessage(error)}`,
        );
      });

      if (Array.isArray(data)) {
        return data.map((item) => this.deserializeCardData(item.data, item.id));
      }
      return [];
    } catch (error) {
      if (error instanceof Error && error.message === 'not-found') {
        return [];
      }
      throw error;
    }
  }

  async findDueCards(query: DueCardsQuery): Promise<readonly Card[]> {
    const currentDate = query.currentDate || new Date();
    const collectionPath: CollectionPath = [this.COLLECTION_NAME];
    const constraints: NoSqlDbQueryConstraint<Record<string, unknown>>[] = [
      {
        type: 'where',
        field: 'userId',
        operator: '==',
        value: query.userId,
      },
      {
        type: 'where',
        field: 'scheduling.nextReviewDate' as keyof Record<string, unknown>,
        operator: '<=',
        value: currentDate.toISOString(),
      },
    ];

    // Add tag constraints if specified
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        constraints.push({
          type: 'array-contains',
          field: 'tags',
          value: tag,
        });
      }
    }

    // Add limit if specified
    if (query.limit) {
      constraints.push({
        type: 'limit',
        value: query.limit,
      });
    }

    const result = await this.db.readCollection({
      path: collectionPath,
      constraints,
    });

    try {
      const data = result.unwrapOrThrow((error) => {
        if (this.isNotFoundError(error)) {
          return [];
        }
        throw new Error(
          `Failed to find due cards: ${this.getErrorMessage(error)}`,
        );
      });

      if (Array.isArray(data)) {
        return data.map((item) =>
          this.deserializeCardData(item.data as CardSerialized, item.id),
        );
      }
      return [];
    } catch (error) {
      if (error instanceof Error && error.message === 'not-found') {
        return [];
      }
      throw error;
    }
  }

  async update(id: string, request: UpdateCardRequest): Promise<Card> {
    // First, get the existing card
    const existingCard = await this.findById(id);
    if (!existingCard) {
      throw new Error(`Card with id ${id} not found`);
    }

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

    result.unwrapOrThrow((error) => {
      throw new Error(`Failed to update card: ${this.getErrorMessage(error)}`);
    });

    return {
      id,
      userId: existingCard.userId,
      tags: updatedTags,
      data: updatedData,
      scheduling: existingCard.scheduling,
      createdAt: existingCard.createdAt,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
    const result = await this.db.deleteDocument(documentPath);

    result.unwrapOrThrow((error) => {
      throw new Error(`Failed to delete card: ${this.getErrorMessage(error)}`);
    });
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

import {
  INoSqlDatabase,
  CollectionPath,
  DocumentPath,
  JsonObject,
} from '@j2blasco/ts-crud';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRepository,
  UserId,
  UserPreferences,
} from './user.interface';
import { Result, resultSuccess, resultError } from '@j2blasco/ts-result';

type UserSerialized = {
  preferences: {
    maxNewCardsPerDay: number;
    maxReviewsPerDay: number;
    timezone: string;
    defaultAlgorithm: string;
  };
  createdAt: string;
  updatedAt: string;
};

// Helper function to create a simple error result that matches our interface
function createErrorResult<T>(message: string): Result<T, string> {
  // Since the interface expects Result<T, string> but the library returns Result<T, ErrorObject>,
  // we'll create a custom result that satisfies the interface by casting the error
  const errorResult = resultError.unknown(message);
  return errorResult as unknown as Result<T, string>;
}

export class NoSqlUserRepository implements UserRepository {
  private readonly COLLECTION_NAME = 'users';

  constructor(private db: INoSqlDatabase) {}

  async create(request: CreateUserRequest): Promise<Result<User, string>> {
    const now = new Date();

    // Apply default preferences for any missing values
    const defaultPreferences: UserPreferences = {
      maxNewCardsPerDay: 20,
      maxReviewsPerDay: 100,
      timezone: 'UTC',
      defaultAlgorithm: 'sm2',
    };

    const finalPreferences: UserPreferences = {
      ...defaultPreferences,
      ...(request.preferences || {}),
    };

    // Convert to JsonObject-compatible format
    const userData: JsonObject = {
      preferences: {
        maxNewCardsPerDay: finalPreferences.maxNewCardsPerDay,
        maxReviewsPerDay: finalPreferences.maxReviewsPerDay,
        timezone: finalPreferences.timezone,
        defaultAlgorithm: finalPreferences.defaultAlgorithm,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const collectionPath: CollectionPath = [this.COLLECTION_NAME];
    const result = await this.db.addToCollection(collectionPath, userData);

    try {
      const createdDocument = result.unwrapOrThrow((error) => {
        throw new Error(
          `Failed to create user: ${this.getErrorMessage(error)}`,
        );
      });

      const user: User = {
        id: createdDocument.id as UserId,
        preferences: finalPreferences,
        createdAt: now,
        updatedAt: now,
      };

      return resultSuccess(user);
    } catch (error) {
      return createErrorResult<User>(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  async findById(id: UserId): Promise<Result<User | null, string>> {
    const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
    const result = await this.db.readDocument(documentPath);

    // Check if the result is a not-found error specifically
    try {
      const data = result.unwrapOrThrow();
      // If we get here, we have valid data
      const user = this.deserializeUserData(data as UserSerialized, id);
      return resultSuccess(user);
    } catch (error) {
      // Check if it's a not-found error
      if (this.isNotFoundError(error)) {
        return resultSuccess(null);
      }
      // For other errors, return an error result
      return createErrorResult<User | null>(
        `Failed to find user by id: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async update(
    id: UserId,
    request: UpdateUserRequest,
  ): Promise<Result<User, string>> {
    // First, get the existing user
    const existingUserResult = await this.findById(id);

    try {
      const existingUser = existingUserResult.unwrapOrThrow();

      if (!existingUser) {
        return createErrorResult<User>(`User with id ${id} not found`);
      }

      // Merge preferences
      const updatedPreferences: UserPreferences = {
        ...existingUser.preferences,
        ...(request.preferences || {}),
      };

      const now = new Date();

      const userData: JsonObject = {
        preferences: {
          maxNewCardsPerDay: updatedPreferences.maxNewCardsPerDay,
          maxReviewsPerDay: updatedPreferences.maxReviewsPerDay,
          timezone: updatedPreferences.timezone,
          defaultAlgorithm: updatedPreferences.defaultAlgorithm,
        },
        createdAt: existingUser.createdAt.toISOString(),
        updatedAt: now.toISOString(),
      };

      const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
      const writeResult = await this.db.writeDocument(documentPath, userData);

      writeResult.unwrapOrThrow((error) => {
        throw new Error(
          `Failed to update user: ${this.getErrorMessage(error)}`,
        );
      });

      const updatedUser: User = {
        id,
        preferences: updatedPreferences,
        createdAt: existingUser.createdAt,
        updatedAt: now,
      };

      return resultSuccess(updatedUser);
    } catch (error) {
      return createErrorResult<User>(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  async delete(id: UserId): Promise<Result<void, string>> {
    // First check if user exists
    const existingUserResult = await this.findById(id);

    try {
      const existingUser = existingUserResult.unwrapOrThrow();

      if (!existingUser) {
        return createErrorResult<void>(`User with id ${id} not found`);
      }

      const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
      const result = await this.db.deleteDocument(documentPath);

      result.unwrapOrThrow((error) => {
        throw new Error(
          `Failed to delete user: ${this.getErrorMessage(error)}`,
        );
      });

      return resultSuccess(undefined as void);
    } catch (error) {
      return createErrorResult<void>(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  private deserializeUserData(dbData: UserSerialized, id: UserId): User {
    const preferences: UserPreferences = {
      maxNewCardsPerDay: dbData.preferences?.maxNewCardsPerDay || 20,
      maxReviewsPerDay: dbData.preferences?.maxReviewsPerDay || 100,
      timezone: dbData.preferences?.timezone || 'UTC',
      defaultAlgorithm:
        (dbData.preferences?.defaultAlgorithm as 'sm2' | 'fsrs') || 'sm2',
    };

    return {
      id,
      preferences,
      createdAt: new Date(dbData.createdAt || new Date()),
      updatedAt: new Date(dbData.updatedAt || new Date()),
    };
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

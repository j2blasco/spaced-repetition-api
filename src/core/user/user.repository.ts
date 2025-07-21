import {
  INoSqlDatabase,
  CollectionPath,
  DocumentPath,
} from '@j2blasco/ts-crud';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRepository,
  UserId,
  UserPreferences,
} from './user.interface';
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

export class NoSqlUserRepository implements UserRepository {
  private readonly COLLECTION_NAME = 'users';

  constructor(private db: INoSqlDatabase) {}

  public async create(
    request: CreateUserRequest,
  ): Promise<Result<User, ErrorUnknown>> {
    const now = new Date();

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

    const userData: UserSerialized = {
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

    return pipe(
      result,
      andThen((createdDocument: { id: string }) => {
        const user: User = {
          id: createdDocument.id as UserId,
          preferences: finalPreferences,
          createdAt: now,
          updatedAt: now,
        };
        return resultSuccess(user);
      }),
    );
  }

  async findById(id: UserId): Promise<Result<User | null, ErrorUnknown>> {
    const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
    const result = await this.db.readDocument(documentPath);

    return pipe(
      result,
      catchError(() => {
        // If not found, return success with null instead of error
        return resultSuccess(null);
      }),
      andThen((data) => {
        if (data === null) {
          return resultSuccess(null);
        }
        const user = this.deserializeUserData(data as UserSerialized, id);
        return resultSuccess(user);
      }),
    );
  }

  async update(
    id: UserId,
    request: UpdateUserRequest,
  ): Promise<Result<User, ErrorWithCode<'not-found'> | ErrorUnknown>> {
    const existingUserResult = await this.findById(id);

    return await asyncPipe(
      existingUserResult,
      andThen((existingUser) => {
        if (existingUser === null) {
          return resultError.withCode('not-found' as const);
        }
        const updatedPreferences: UserPreferences = {
          ...existingUser.preferences,
          ...(request.preferences || {}),
        };
        const now = new Date();
        const userData: UserSerialized = {
          preferences: {
            maxNewCardsPerDay: updatedPreferences.maxNewCardsPerDay,
            maxReviewsPerDay: updatedPreferences.maxReviewsPerDay,
            timezone: updatedPreferences.timezone,
            defaultAlgorithm: updatedPreferences.defaultAlgorithm,
          },
          createdAt: existingUser.createdAt.toISOString(),
          updatedAt: now.toISOString(),
        };
        return resultSuccess({
          userData,
          existingUser,
          updatedPreferences,
          now,
        });
      }),
      andThenAsync(
        async ({ userData, existingUser, updatedPreferences, now }) => {
          const documentPath: DocumentPath = [this.COLLECTION_NAME, id];
          const result = await this.db.writeDocument(documentPath, userData);
          return pipe(
            result,
            andThen(() => {
              const updatedUser: User = {
                id,
                preferences: updatedPreferences,
                createdAt: existingUser.createdAt,
                updatedAt: now,
              };
              return resultSuccess(updatedUser);
            }),
          );
        },
      ),
    );
  }

  async delete(id: UserId): Promise<Result<SuccessVoid, ErrorUnknown>> {
    const existingUserResult = await this.findById(id);

    return await asyncPipe(
      existingUserResult,
      andThen((existingUser) => {
        if (existingUser === null) {
          return resultError.unknown(`User with id ${id} not found`);
        }
        return resultSuccess(existingUser);
      }),
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
}

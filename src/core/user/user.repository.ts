import {
  INoSqlDatabase,
  CollectionPath,
  DocumentPath,
} from '@j2blasco/ts-crud';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  IUserRepository,
  UserId,
  UserPreferences,
  SpacedRepetitionAlgorithmType,
  UserSerialized,
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

const defaultPreferences: UserPreferences = {
  maxNewCardsPerDay: 20,
  maxReviewsPerDay: 100,
  defaultAlgorithm: 'sm2',
  timezone: 'UTC',
};

export function serializeUser(user: User): UserSerialized {
  return {
    id: user.id,
    preferences: {
      maxNewCardsPerDay: user.preferences.maxNewCardsPerDay,
      maxReviewsPerDay: user.preferences.maxReviewsPerDay,
      defaultAlgorithm: user.preferences.defaultAlgorithm,
      timezone: user.preferences.timezone,
    },
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function deserializeUser(
  serializedUser: UserSerialized,
  id: UserId,
): User {
  const preferences: UserPreferences = {
    maxNewCardsPerDay: serializedUser.preferences.maxNewCardsPerDay,
    maxReviewsPerDay: serializedUser.preferences.maxReviewsPerDay,
    defaultAlgorithm: serializedUser.preferences
      .defaultAlgorithm as SpacedRepetitionAlgorithmType,
    timezone: serializedUser.preferences.timezone,
  };

  return {
    id,
    preferences,
    createdAt: new Date(serializedUser.createdAt),
    updatedAt: new Date(serializedUser.updatedAt),
  };
}

export class UserRepository implements IUserRepository {
  private readonly COLLECTION_NAME = 'users';

  constructor(private db: INoSqlDatabase) {}

  public async create(
    request: CreateUserRequest,
  ): Promise<Result<User, ErrorUnknown>> {
    const now = new Date();

    const finalPreferences: UserPreferences = {
      ...defaultPreferences,
      ...(request.preferences || {}),
    };

    // Create a temporary User object to serialize
    const tempUser: User = {
      id: '' as UserId, // Will be replaced with actual ID after creation
      preferences: finalPreferences,
      createdAt: now,
      updatedAt: now,
    };

    const userData = serializeUser(tempUser);

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
        const user = deserializeUser(data as UserSerialized, id);
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

        // Create updated user object to serialize
        const updatedUser: User = {
          id,
          preferences: updatedPreferences,
          createdAt: existingUser.createdAt,
          updatedAt: now,
        };

        const userData = serializeUser(updatedUser);

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
}

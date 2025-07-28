import {
  ErrorUnknown,
  ErrorWithCode,
  Result,
  SuccessVoid,
} from '@j2blasco/ts-result';

export type UserId = string;

export type SpacedRepetitionAlgorithmType = 'sm2' | 'fsrs';

export type UserPreferencesSerialized = {
  readonly maxNewCardsPerDay: number;
  readonly maxReviewsPerDay: number;
  readonly defaultAlgorithm: string;
  readonly timezone?: string;
};

export type UserPreferences = {
  readonly maxNewCardsPerDay: number;
  readonly maxReviewsPerDay: number;
  readonly defaultAlgorithm: SpacedRepetitionAlgorithmType;
  readonly timezone?: string;
};

export type User = {
  readonly id: UserId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly preferences: UserPreferences;
};

export type UserSerialized = {
  readonly id: UserId;
  readonly preferences: UserPreferencesSerialized;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateUserRequest = {
  readonly preferences?: Partial<UserPreferences>;
};

export type UpdateUserRequest = {
  readonly preferences?: Partial<UserPreferences>;
};

export interface IUserRepository {
  /**
   * Create a new user
   */
  create(request: CreateUserRequest): Promise<Result<User, ErrorUnknown>>;

  /**
   * Find a user by ID
   */

  // TODO:
  // ): Promise<Result<User, ErrorWithCode<'not-found'> | ErrorUnknown>>;
  findById(
    id: UserId,
  ): Promise<Result<User | null, ErrorWithCode<'not-found'> | ErrorUnknown>>;

  /**
   * Update an existing user
   */
  update(
    id: UserId,
    request: UpdateUserRequest,
  ): Promise<Result<User, ErrorWithCode<'not-found'> | ErrorUnknown>>;

  /**
   * Delete a user
   */
  delete(id: UserId): Promise<Result<SuccessVoid, ErrorUnknown>>;
}

import {
  ErrorUnknown,
  ErrorWithCode,
  Result,
  SuccessVoid,
} from '@j2blasco/ts-result';

export type UserId = string;

export interface UserPreferences {
  readonly maxNewCardsPerDay: number;
  readonly maxReviewsPerDay: number;
  readonly timezone: string;
  readonly defaultAlgorithm: 'sm2' | 'fsrs';
}

export interface User {
  readonly id: UserId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly preferences: UserPreferences;
}

export interface CreateUserRequest {
  readonly preferences?: Partial<UserPreferences>;
}

export interface UpdateUserRequest {
  readonly preferences?: Partial<UserPreferences>;
}

export interface UserRepository {
  /**
   * Create a new user
   */
  create(request: CreateUserRequest): Promise<Result<User, ErrorUnknown>>;

  /**
   * Find a user by ID
   */
  findById(id: UserId): Promise<Result<User | null, ErrorUnknown>>;

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

export type UserId = string;

export interface UserPreferences {
  readonly dailyNewCards: number;
  readonly maxReviews: number;
  readonly timezone: string;
  readonly defaultAlgorithm: 'sm2' | 'sm4' | 'fsrs';
}

export interface User {
  readonly id: UserId;
  readonly username: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly preferences: UserPreferences;
}

export interface CreateUserRequest {
  readonly username: string;
  readonly email: string;
  readonly preferences?: Partial<UserPreferences>;
}

export interface UpdateUserRequest {
  readonly username?: string;
  readonly email?: string;
  readonly preferences?: Partial<UserPreferences>;
}

export interface UserRepository {
  /**
   * Create a new user
   */
  create(request: CreateUserRequest): Promise<User>;

  /**
   * Find a user by ID
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Find a user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Update an existing user
   */
  update(id: UserId, request: UpdateUserRequest): Promise<User>;

  /**
   * Delete a user
   */
  delete(id: UserId): Promise<void>;

  /**
   * Check if a user exists
   */
  exists(id: UserId): Promise<boolean>;
}

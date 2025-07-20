// TODO: simplify, we don't need usernmae and email, this is going to be an api that other systems will use, they will link the id of the created user with other usersid, so need for this system to keep track of email nor username
export interface UserPreferences {
  readonly maxNewCardsPerDay: number;
  readonly maxReviewsPerDay: number;
  readonly timezone: string;
  readonly defaultAlgorithm: 'sm2' | 'fsrs';
}

export interface User {
  readonly id: string;
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
  findById(id: string): Promise<User | null>;

  /**
   * Update an existing user
   */
  update(id: string, request: UpdateUserRequest): Promise<User>;

  /**
   * Delete a user
   */
  delete(id: string): Promise<void>;
}

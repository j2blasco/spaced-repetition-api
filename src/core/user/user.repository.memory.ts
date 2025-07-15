import { randomUUID } from 'crypto';
import {
  User,
  UserId,
  UserRepository,
  CreateUserRequest,
  UpdateUserRequest,
  UserPreferences,
} from './user.interface.js';

/**
 * In-memory implementation of UserRepository for testing purposes
 */
export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  private getDefaultPreferences(): UserPreferences {
    return {
      dailyNewCards: 20,
      maxReviews: 100,
      timezone: 'UTC',
      defaultAlgorithm: 'sm2',
    };
  }

  async create(request: CreateUserRequest): Promise<User> {
    // Check for duplicate username
    const existingByUsername = Array.from(this.users.values()).find(
      (user) => user.username === request.username,
    );
    if (existingByUsername) {
      throw new Error(`Username '${request.username}' already exists`);
    }

    // Check for duplicate email
    const existingByEmail = Array.from(this.users.values()).find(
      (user) => user.email === request.email,
    );
    if (existingByEmail) {
      throw new Error(`Email '${request.email}' already exists`);
    }

    const id: UserId = { value: randomUUID() };
    const now = new Date();
    const preferences: UserPreferences = {
      ...this.getDefaultPreferences(),
      ...request.preferences,
    };

    const user: User = {
      id,
      username: request.username,
      email: request.email,
      preferences,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id.value, user);
    return user;
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.value) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
    return user || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(
      (u) => u.username === username,
    );
    return user || null;
  }

  async update(id: UserId, request: UpdateUserRequest): Promise<User> {
    const existingUser = this.users.get(id.value);
    if (!existingUser) {
      throw new Error(`User with id '${id.value}' not found`);
    }

    // Check for username conflicts (if username is being updated)
    if (request.username && request.username !== existingUser.username) {
      const existingByUsername = Array.from(this.users.values()).find(
        (user) => user.username === request.username,
      );
      if (existingByUsername) {
        throw new Error(`Username '${request.username}' already exists`);
      }
    }

    // Check for email conflicts (if email is being updated)
    if (request.email && request.email !== existingUser.email) {
      const existingByEmail = Array.from(this.users.values()).find(
        (user) => user.email === request.email,
      );
      if (existingByEmail) {
        throw new Error(`Email '${request.email}' already exists`);
      }
    }

    const updatedUser: User = {
      ...existingUser,
      username: request.username ?? existingUser.username,
      email: request.email ?? existingUser.email,
      preferences: {
        ...existingUser.preferences,
        ...request.preferences,
      },
      updatedAt: new Date(),
    };

    this.users.set(id.value, updatedUser);
    return updatedUser;
  }

  async delete(id: UserId): Promise<void> {
    const exists = this.users.has(id.value);
    if (!exists) {
      throw new Error(`User with id '${id.value}' not found`);
    }
    this.users.delete(id.value);
  }

  async exists(id: UserId): Promise<boolean> {
    return this.users.has(id.value);
  }

  // Helper method for testing
  clear(): void {
    this.users.clear();
  }
}

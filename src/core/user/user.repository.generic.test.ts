import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  UserRepository,
  CreateUserRequest,
  UpdateUserRequest,
  UserPreferences,
} from './user.interface';

/**
 * Generic test suite for UserRepository implementations
 * Any implementation of UserRepository should pass these tests
 */
export function testUserRepository(
  createUserRepository: () => Promise<UserRepository>,
) {
  describe('UserRepository', () => {
    let repository: UserRepository;

    beforeEach(async () => {
      repository = await createUserRepository();
    });

    describe('create', () => {
      it('should create a user with full preferences', async () => {
        const preferences: UserPreferences = {
          maxNewCardsPerDay: 20,
          maxReviewsPerDay: 100,
          timezone: 'UTC',
          defaultAlgorithm: 'sm2',
        };

        const request: CreateUserRequest = {
          preferences,
        };

        const result = await repository.create(request);

        expect(() => result.unwrapOrThrow()).not.toThrow();
        const user = result.unwrapOrThrow();
        expect(user.id).toBeDefined();
        expect(user.id).toBeTruthy();
        expect(user.preferences.maxNewCardsPerDay).toBe(20);
        expect(user.preferences.maxReviewsPerDay).toBe(100);
        expect(user.preferences.timezone).toBe('UTC');
        expect(user.preferences.defaultAlgorithm).toBe('sm2');
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
        expect(user.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        expect(user.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
      });

      it('should create a user with partial preferences', async () => {
        const request: CreateUserRequest = {
          preferences: {
            maxNewCardsPerDay: 15,
            timezone: 'America/New_York',
          },
        };

        const result = await repository.create(request);

        expect(() => result.unwrapOrThrow()).not.toThrow();
        const user = result.unwrapOrThrow();
        expect(user.id).toBeDefined();
        expect(user.preferences.maxNewCardsPerDay).toBe(15);
        expect(user.preferences.timezone).toBe('America/New_York');
        // Other preferences should have default values
        expect(user.preferences.maxReviewsPerDay).toBeDefined();
        expect(user.preferences.defaultAlgorithm).toBeDefined();
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it('should create a user with minimal request (empty preferences)', async () => {
        const request: CreateUserRequest = {};

        const result = await repository.create(request);

        expect(() => result.unwrapOrThrow()).not.toThrow();
        const user = result.unwrapOrThrow();
        expect(user.id).toBeDefined();
        expect(user.preferences).toBeDefined();
        expect(user.preferences.maxNewCardsPerDay).toBeDefined();
        expect(user.preferences.maxReviewsPerDay).toBeDefined();
        expect(user.preferences.timezone).toBeDefined();
        expect(user.preferences.defaultAlgorithm).toBeDefined();
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it('should create a user with no preferences provided', async () => {
        const request: CreateUserRequest = {
          preferences: undefined,
        };

        const result = await repository.create(request);

        expect(() => result.unwrapOrThrow()).not.toThrow();
        const user = result.unwrapOrThrow();
        expect(user.id).toBeDefined();
        expect(user.preferences).toBeDefined();
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it('should generate unique IDs for different users', async () => {
        const request1: CreateUserRequest = {
          preferences: { maxNewCardsPerDay: 10 },
        };
        const request2: CreateUserRequest = {
          preferences: { maxNewCardsPerDay: 20 },
        };

        const result1 = await repository.create(request1);
        const result2 = await repository.create(request2);

        const user1 = result1.unwrapOrThrow();
        const user2 = result2.unwrapOrThrow();

        expect(user1.id).not.toBe(user2.id);
        expect(user1.preferences.maxNewCardsPerDay).toBe(10);
        expect(user2.preferences.maxNewCardsPerDay).toBe(20);
      });
    });

    describe('findById', () => {
      it('should find existing user by id', async () => {
        const createRequest: CreateUserRequest = {
          preferences: {
            maxNewCardsPerDay: 25,
            maxReviewsPerDay: 125,
            timezone: 'Europe/London',
            defaultAlgorithm: 'fsrs',
          },
        };

        const createResult = await repository.create(createRequest);
        const created = createResult.unwrapOrThrow();

        const findResult = await repository.findById(created.id);

        expect(() => findResult.unwrapOrThrow()).not.toThrow();
        const found = findResult.unwrapOrThrow();
        expect(found).not.toBeNull();
        expect(found!.id).toEqual(created.id);
        expect(found!.preferences.maxNewCardsPerDay).toBe(25);
        expect(found!.preferences.maxReviewsPerDay).toBe(125);
        expect(found!.preferences.timezone).toBe('Europe/London');
        expect(found!.preferences.defaultAlgorithm).toBe('fsrs');
        expect(found!.createdAt).toEqual(created.createdAt);
        expect(found!.updatedAt).toEqual(created.updatedAt);
      });

      it('should return null for non-existent user', async () => {
        const result = await repository.findById('non-existent-id');

        expect(() => result.unwrapOrThrow()).not.toThrow();
        const found = result.unwrapOrThrow();
        expect(found).toBeNull();
      });

      it('should handle empty string id gracefully', async () => {
        const result = await repository.findById('');

        expect(() => result.unwrapOrThrow()).not.toThrow();
        const found = result.unwrapOrThrow();
        expect(found).toBeNull();
      });
    });

    describe('update', () => {
      it('should update user preferences completely', async () => {
        const createRequest: CreateUserRequest = {
          preferences: {
            maxNewCardsPerDay: 10,
            maxReviewsPerDay: 50,
            timezone: 'UTC',
            defaultAlgorithm: 'sm2',
          },
        };

        const createResult = await repository.create(createRequest);
        const created = createResult.unwrapOrThrow();

        // Add a small delay to ensure updatedAt changes
        await new Promise((resolve) => setTimeout(resolve, 10));

        const updateRequest: UpdateUserRequest = {
          preferences: {
            maxNewCardsPerDay: 30,
            maxReviewsPerDay: 150,
            timezone: 'America/Los_Angeles',
            defaultAlgorithm: 'fsrs',
          },
        };

        const updateResult = await repository.update(created.id, updateRequest);

        expect(() => updateResult.unwrapOrThrow()).not.toThrow();
        const updated = updateResult.unwrapOrThrow();
        expect(updated.id).toBe(created.id);
        expect(updated.preferences.maxNewCardsPerDay).toBe(30);
        expect(updated.preferences.maxReviewsPerDay).toBe(150);
        expect(updated.preferences.timezone).toBe('America/Los_Angeles');
        expect(updated.preferences.defaultAlgorithm).toBe('fsrs');
        expect(updated.createdAt).toEqual(created.createdAt);
        expect(updated.updatedAt.getTime()).toBeGreaterThan(
          created.updatedAt.getTime(),
        );
      });

      it('should update partial user preferences', async () => {
        const createRequest: CreateUserRequest = {
          preferences: {
            maxNewCardsPerDay: 10,
            maxReviewsPerDay: 50,
            timezone: 'UTC',
            defaultAlgorithm: 'sm2',
          },
        };

        const createResult = await repository.create(createRequest);
        const created = createResult.unwrapOrThrow();

        const updateRequest: UpdateUserRequest = {
          preferences: {
            maxNewCardsPerDay: 25,
            timezone: 'Europe/Berlin',
          },
        };

        const updateResult = await repository.update(created.id, updateRequest);

        expect(() => updateResult.unwrapOrThrow()).not.toThrow();
        const updated = updateResult.unwrapOrThrow();
        expect(updated.preferences.maxNewCardsPerDay).toBe(25);
        expect(updated.preferences.timezone).toBe('Europe/Berlin');
        // These should remain unchanged
        expect(updated.preferences.maxReviewsPerDay).toBe(50);
        expect(updated.preferences.defaultAlgorithm).toBe('sm2');
      });

      it('should handle empty preferences update', async () => {
        const createResult = await repository.create({});
        const created = createResult.unwrapOrThrow();

        const updateRequest: UpdateUserRequest = {
          preferences: {},
        };

        const updateResult = await repository.update(created.id, updateRequest);

        expect(() => updateResult.unwrapOrThrow()).not.toThrow();
        const updated = updateResult.unwrapOrThrow();
        expect(updated.id).toBe(created.id);
        expect(updated.preferences).toEqual(created.preferences);
      });

      it('should handle undefined preferences in update', async () => {
        const createResult = await repository.create({
          preferences: {
            maxNewCardsPerDay: 15,
            maxReviewsPerDay: 75,
            timezone: 'UTC',
            defaultAlgorithm: 'sm2',
          },
        });
        const created = createResult.unwrapOrThrow();

        const updateRequest: UpdateUserRequest = {
          preferences: undefined,
        };

        const updateResult = await repository.update(created.id, updateRequest);

        expect(() => updateResult.unwrapOrThrow()).not.toThrow();
        const updated = updateResult.unwrapOrThrow();
        expect(updated.preferences).toEqual(created.preferences);
      });

      it('should return error for non-existent user', async () => {
        const updateRequest: UpdateUserRequest = {
          preferences: {
            maxNewCardsPerDay: 25,
          },
        };

        const result = await repository.update(
          'non-existent-id',
          updateRequest,
        );

        expect(() => result.unwrapOrThrow()).toThrow();
      });

      it('should update updatedAt timestamp but preserve createdAt', async () => {
        const createResult = await repository.create({});
        const created = createResult.unwrapOrThrow();

        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10));

        const updateResult = await repository.update(created.id, {
          preferences: { maxNewCardsPerDay: 99 },
        });

        const updated = updateResult.unwrapOrThrow();
        expect(updated.createdAt).toEqual(created.createdAt);
        expect(updated.updatedAt.getTime()).toBeGreaterThan(
          created.updatedAt.getTime(),
        );
      });
    });

    describe('delete', () => {
      it('should delete existing user', async () => {
        const createResult = await repository.create({
          preferences: {
            maxNewCardsPerDay: 5,
            maxReviewsPerDay: 25,
            timezone: 'Asia/Tokyo',
            defaultAlgorithm: 'sm2',
          },
        });
        const created = createResult.unwrapOrThrow();

        const deleteResult = await repository.delete(created.id);

        expect(() => deleteResult.unwrapOrThrow()).not.toThrow();

        // Verify user is deleted by trying to find it
        const findResult = await repository.findById(created.id);
        const found = findResult.unwrapOrThrow();
        expect(found).toBeNull();
      });

      it('should return error for non-existent user', async () => {
        const result = await repository.delete('non-existent-id');

        expect(() => result.unwrapOrThrow()).toThrow();
      });

      it('should handle deletion of already deleted user', async () => {
        const createResult = await repository.create({});
        const created = createResult.unwrapOrThrow();

        // Delete once
        const firstDelete = await repository.delete(created.id);
        expect(() => firstDelete.unwrapOrThrow()).not.toThrow();

        // Try to delete again
        const secondDelete = await repository.delete(created.id);
        expect(() => secondDelete.unwrapOrThrow()).toThrow();
      });
    });

    describe('integration scenarios', () => {
      it('should handle complete user lifecycle', async () => {
        // Create user
        const createRequest: CreateUserRequest = {
          preferences: {
            maxNewCardsPerDay: 10,
            maxReviewsPerDay: 50,
            timezone: 'UTC',
            defaultAlgorithm: 'sm2',
          },
        };

        const createResult = await repository.create(createRequest);
        const created = createResult.unwrapOrThrow();

        // Find user
        const findResult = await repository.findById(created.id);
        const found = findResult.unwrapOrThrow();
        expect(found).not.toBeNull();
        expect(found!.id).toBe(created.id);

        // Update user
        const updateResult = await repository.update(created.id, {
          preferences: { maxNewCardsPerDay: 20 },
        });
        const updated = updateResult.unwrapOrThrow();
        expect(updated.preferences.maxNewCardsPerDay).toBe(20);

        // Delete user
        const deleteResult = await repository.delete(created.id);
        expect(() => deleteResult.unwrapOrThrow()).not.toThrow();

        // Verify deletion
        const findAfterDelete = await repository.findById(created.id);
        const foundAfterDelete = findAfterDelete.unwrapOrThrow();
        expect(foundAfterDelete).toBeNull();
      });

      it('should handle multiple users independently', async () => {
        const user1Result = await repository.create({
          preferences: { maxNewCardsPerDay: 10 },
        });
        const user2Result = await repository.create({
          preferences: { maxNewCardsPerDay: 20 },
        });

        const user1 = user1Result.unwrapOrThrow();
        const user2 = user2Result.unwrapOrThrow();

        expect(user1.id).not.toBe(user2.id);

        // Update one user shouldn't affect the other
        await repository.update(user1.id, {
          preferences: { maxNewCardsPerDay: 99 },
        });

        const user2AfterUpdate = (
          await repository.findById(user2.id)
        ).unwrapOrThrow();
        expect(user2AfterUpdate!.preferences.maxNewCardsPerDay).toBe(20);

        // Delete one user shouldn't affect the other
        await repository.delete(user1.id);

        const user2AfterDelete = (
          await repository.findById(user2.id)
        ).unwrapOrThrow();
        expect(user2AfterDelete).not.toBeNull();
        expect(user2AfterDelete!.id).toBe(user2.id);
      });
    });
  });
}

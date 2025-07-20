import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  UserRepository,
  CreateUserRequest,
  UpdateUserRequest,
  UserId,
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
      it('should create a user with all fields', async () => {
        const request: CreateUserRequest = {
          username: 'testuser',
          email: 'test@example.com',
          preferences: {
            dailyNewCards: 20,
            maxReviews: 100,
            timezone: 'UTC',
            defaultAlgorithm: 'sm2',
          },
        };

        const user = await repository.create(request);

        expect(user.id).toBeDefined();
        expect(user.username).toBe('testuser');
        expect(user.email).toBe('test@example.com');
        expect(user.preferences.dailyNewCards).toBe(20);
        expect(user.preferences.maxReviews).toBe(100);
        expect(user.preferences.timezone).toBe('UTC');
        expect(user.preferences.defaultAlgorithm).toBe('sm2');
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it('should create a user with minimal fields and defaults', async () => {
        const request: CreateUserRequest = {
          username: 'minimaluser',
          email: 'minimal@example.com',
        };

        const user = await repository.create(request);

        expect(user.id).toBeDefined();
        expect(user.username).toBe('minimaluser');
        expect(user.email).toBe('minimal@example.com');
        expect(user.preferences).toBeDefined();
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error for duplicate username', async () => {
        const request: CreateUserRequest = {
          username: 'duplicate',
          email: 'first@example.com',
        };

        await repository.create(request);

        const duplicateRequest: CreateUserRequest = {
          username: 'duplicate',
          email: 'second@example.com',
        };

        await expect(repository.create(duplicateRequest)).rejects.toThrow();
      });

      it('should throw error for duplicate email', async () => {
        const request: CreateUserRequest = {
          username: 'first',
          email: 'duplicate@example.com',
        };

        await repository.create(request);

        const duplicateRequest: CreateUserRequest = {
          username: 'second',
          email: 'duplicate@example.com',
        };

        await expect(repository.create(duplicateRequest)).rejects.toThrow();
      });
    });

    describe('findById', () => {
      it('should find existing user by id', async () => {
        const created = await repository.create({
          username: 'findtest',
          email: 'find@example.com',
        });

        const found = await repository.findById(created.id);

        expect(found).not.toBeNull();
        expect(found!.id).toEqual(created.id);
        expect(found!.username).toBe('findtest');
        expect(found!.email).toBe('find@example.com');
      });

      it('should return null for non-existent id', async () => {
        const found = await repository.findById('nonExistentId');
        expect(found).toBeNull();
      });
    });

    describe('findByEmail', () => {
      it('should find existing user by email', async () => {
        const created = await repository.create({
          username: 'emailtest',
          email: 'emailtest@example.com',
        });

        const found = await repository.findByEmail('emailtest@example.com');

        expect(found).not.toBeNull();
        expect(found!.id).toEqual(created.id);
        expect(found!.email).toBe('emailtest@example.com');
      });

      it('should return null for non-existent email', async () => {
        const found = await repository.findByEmail('nonexistent@example.com');
        expect(found).toBeNull();
      });
    });

    describe('findByUsername', () => {
      it('should find existing user by username', async () => {
        const created = await repository.create({
          username: 'usernametest',
          email: 'usernametest@example.com',
        });

        const found = await repository.findByUsername('usernametest');

        expect(found).not.toBeNull();
        expect(found!.id).toEqual(created.id);
        expect(found!.username).toBe('usernametest');
      });

      it('should return null for non-existent username', async () => {
        const found = await repository.findByUsername('nonexistent');
        expect(found).toBeNull();
      });
    });

    describe('update', () => {
      it('should update user fields', async () => {
        const created = await repository.create({
          username: 'updatetest',
          email: 'update@example.com',
        });

        // Small delay to ensure updatedAt is different
        await new Promise((resolve) => setTimeout(resolve, 10));

        const updateRequest: UpdateUserRequest = {
          username: 'updateduser',
          email: 'updated@example.com',
          preferences: {
            dailyNewCards: 30,
            maxReviews: 150,
            timezone: 'EST',
            defaultAlgorithm: 'sm4',
          },
        };

        const updated = await repository.update(created.id, updateRequest);

        expect(updated.id).toEqual(created.id);
        expect(updated.username).toBe('updateduser');
        expect(updated.email).toBe('updated@example.com');
        expect(updated.preferences.dailyNewCards).toBe(30);
        expect(updated.preferences.defaultAlgorithm).toBe('sm4');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(
          created.updatedAt.getTime(),
        );
      });

      it('should update partial fields', async () => {
        const created = await repository.create({
          username: 'partialtest',
          email: 'partial@example.com',
        });

        const updateRequest: UpdateUserRequest = {
          username: 'partialupdated',
        };

        const updated = await repository.update(created.id, updateRequest);

        expect(updated.username).toBe('partialupdated');
        expect(updated.email).toBe('partial@example.com'); // unchanged
      });

      it('should throw error for non-existent user', async () => {
        const updateRequest: UpdateUserRequest = {
          username: 'updated',
        };

        await expect(
          repository.update('nonExistentId', updateRequest),
        ).rejects.toThrow();
      });
    });

    describe('delete', () => {
      it('should delete existing user', async () => {
        const created = await repository.create({
          username: 'deletetest',
          email: 'delete@example.com',
        });

        await repository.delete(created.id);

        const found = await repository.findById(created.id);
        expect(found).toBeNull();
      });

      it('should throw error when deleting non-existent user', async () => {
        await expect(repository.delete('nonExistentId')).rejects.toThrow();
      });
    });

    describe('exists', () => {
      it('should return true for existing user', async () => {
        const created = await repository.create({
          username: 'existstest',
          email: 'exists@example.com',
        });

        const exists = await repository.exists(created.id);
        expect(exists).toBe(true);
      });

      it('should return false for non-existent user', async () => {
        const exists = await repository.exists('nonExistentId');
        expect(exists).toBe(false);
      });
    });
  });
}

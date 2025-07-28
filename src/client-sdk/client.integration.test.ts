import SpacedRepetitionClient from './index';
import { startServer } from '../index';
import { beforeAll, describe, expect, it } from 'vitest';

// TODO:
describe.skip('SpacedRepetitionClient Integration Tests', () => {
  let client: SpacedRepetitionClient;
  const testPort = 4002;

  beforeAll(() => {
    startServer({
      envType: 'test',
      port: testPort,
    });

    // Initialize the client
    client = new SpacedRepetitionClient({
      baseUrl: `http://localhost:${testPort}`,
      timeout: 10000,
    });
  }, 30000); // 30 second timeout for server startup

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const result = await client.healthCheck();
      expect(result).toBeDefined();
    });
  });

  describe('User Management', () => {
    let userId: string;

    it('should create a user', async () => {
      const user = await client.createUser({
        preferences: {
          maxNewCardsPerDay: 20,
          maxReviewsPerDay: 100,
          timezone: 'UTC',
        },
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.preferences?.maxNewCardsPerDay).toBe(20);
      userId = user.id;
    });

    it('should get a user by id', async () => {
      const user = await client.getUser(userId);
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.preferences?.maxNewCardsPerDay).toBe(20);
    });

    it('should delete a user', async () => {
      await expect(client.deleteUser(userId)).resolves.not.toThrow();
    });
  });
});

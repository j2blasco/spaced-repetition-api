import SpacedRepetitionClient from './index';
// import { startServer } from '../index';
import { beforeAll, describe, expect, it } from 'vitest';

// TODO:
describe.only('SpacedRepetitionClient Integration Tests', () => {
  let client: SpacedRepetitionClient;
  const testPort = 4001;
  const baseUrl = `http://localhost:${testPort}`;

  beforeAll(() => {
    // startServer({
    //   envType: 'test',
    //   port: testPort,
    // });

    client = new SpacedRepetitionClient({
      baseUrl,
      timeout: 10000,
    });
  });

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

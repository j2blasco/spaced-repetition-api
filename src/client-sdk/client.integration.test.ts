import SpacedRepetitionClient from './index';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RestServerTestbed } from 'src/api/rest/rest-server-testbed.utils.test';

describe('SpacedRepetitionClient Integration Tests', () => {
  let client: SpacedRepetitionClient;

  let testbed: RestServerTestbed;

  beforeAll(async () => {
    testbed = await RestServerTestbed.create({ intialPort: 4000 });
    client = new SpacedRepetitionClient({
      baseUrl: `http://localhost:${testbed.port}`,
      timeout: 10000,
    });
  });

  afterAll(async () => {
    await testbed.dispose();
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

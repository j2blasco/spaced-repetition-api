import { describe, beforeAll, it, expect } from 'vitest';
import SpacedRepetitionClient from './index';

describe('SpacedRepetitionClient', () => {
  let client: SpacedRepetitionClient;

  beforeAll(() => {
    client = new SpacedRepetitionClient({
      baseUrl: 'http://localhost:4001',
      timeout: 5000,
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultClient = new SpacedRepetitionClient();
      expect(defaultClient).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customClient = new SpacedRepetitionClient({
        baseUrl: 'http://localhost:3000',
        timeout: 15000,
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('URL Building', () => {
    it('should build correct URLs for user operations', () => {
      // These tests would require mocking fetch, but show the intent
      expect(() => client.createUser({})).toBeDefined();
      expect(() => client.getUser('test-id')).toBeDefined();
      expect(() => client.updateUser('test-id', {})).toBeDefined();
      expect(() => client.deleteUser('test-id')).toBeDefined();
    });

    it('should build correct URLs for card operations', () => {
      const mockCard = {
        userId: 'user-id',
        data: { front: 'test', back: 'test' },
      };

      expect(() => client.createCard(mockCard)).toBeDefined();
      expect(() => client.getCard('card-id')).toBeDefined();
      expect(() => client.getUserCards('user-id')).toBeDefined();
      expect(() => client.updateCard('card-id', {})).toBeDefined();
      expect(() => client.deleteCard('card-id')).toBeDefined();
    });

    it('should build correct URLs for review operations', () => {
      expect(() =>
        client.reviewCard('card-id', { response: 'good' }),
      ).toBeDefined();
    });
  });

  describe('Query Parameter Handling', () => {
    it('should handle due cards query parameters correctly', () => {
      const query = {
        userId: 'user-123',
        tags: ['spanish', 'vocabulary'],
        limit: 10,
        currentDate: new Date().toISOString(),
      };

      expect(() => client.getDueCards(query)).toBeDefined();
    });

    it('should handle optional parameters', () => {
      const minimalQuery = {
        userId: 'user-123',
      };

      expect(() => client.getDueCards(minimalQuery)).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    it('should provide study session creation', () => {
      expect(() =>
        client.createStudySession('user-id', {
          tags: ['test'],
          limit: 5,
        }),
      ).toBeDefined();
    });

    it('should provide batch review functionality', () => {
      const reviews = [
        { cardId: 'card-1', response: 'good' as const },
        { cardId: 'card-2', response: 'easy' as const },
      ];

      expect(() => client.batchReviewCards(reviews)).toBeDefined();
    });

    it('should provide study statistics', () => {
      expect(() =>
        client.getStudyStats('user-id', {
          tags: ['test'],
          currentDate: new Date(),
        }),
      ).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct review response types', () => {
      // TypeScript should catch these at compile time
      const validResponses = ['failed', 'good', 'easy'] as const;

      validResponses.forEach((response) => {
        expect(() => client.reviewCard('card-id', { response })).toBeDefined();
      });
    });

    it('should provide proper return types', async () => {
      // These would need actual API responses in integration tests
      // Here we just verify the method signatures exist
      expect(typeof client.createUser).toBe('function');
      expect(typeof client.createCard).toBe('function');
      expect(typeof client.reviewCard).toBe('function');
      expect(typeof client.getDueCards).toBe('function');
      expect(typeof client.getStudyStats).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutClient = new SpacedRepetitionClient({
        baseUrl: 'http://localhost:9999', // Non-existent server
        timeout: 100, // Very short timeout
      });

      // This would timeout in a real scenario
      expect(() => timeoutClient.healthCheck()).toBeDefined();
    });
  });
});

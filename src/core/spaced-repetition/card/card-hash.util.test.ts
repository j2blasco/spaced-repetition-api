import { generateCardDataHash } from './card-hash.util';
import { describe, it, expect } from 'vitest';

describe('Card Hash Utilities', () => {
  describe('generateCardDataHash', () => {
    it('should generate consistent hash for same data', () => {
      const cardData = {
        userId: 'user123',
        data: {
          front: 'What is TypeScript?',
          back: 'A typed superset of JavaScript',
          difficulty: 3,
        },
        tags: ['programming', 'typescript'],
      };

      const hash1 = generateCardDataHash(cardData);
      const hash2 = generateCardDataHash(cardData);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different data', () => {
      const cardData1 = {
        userId: 'user123',
        data: {
          front: 'What is TypeScript?',
          back: 'A typed superset of JavaScript',
        },
      };

      const cardData2 = {
        userId: 'user123',
        data: {
          front: 'What is JavaScript?',
          back: 'A programming language',
        },
      };

      const hash1 = generateCardDataHash(cardData1);
      const hash2 = generateCardDataHash(cardData2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different users', () => {
      const data = {
        front: 'Same question',
        back: 'Same answer',
      };

      const hash1 = generateCardDataHash({
        userId: 'user1',
        data,
      });

      const hash2 = generateCardDataHash({
        userId: 'user2',
        data,
      });

      expect(hash1).not.toBe(hash2);
    });

    it('should generate same hash regardless of object key order', () => {
      const cardData1 = {
        userId: 'user123',
        data: {
          front: 'Question',
          back: 'Answer',
          meta: {
            category: 'test',
            level: 1,
          },
        },
      };

      const cardData2 = {
        userId: 'user123',
        data: {
          back: 'Answer',
          meta: {
            level: 1,
            category: 'test',
          },
          front: 'Question',
        },
      };

      const hash1 = generateCardDataHash(cardData1);
      const hash2 = generateCardDataHash(cardData2);

      expect(hash1).toBe(hash2);
    });

    it('should generate same hash regardless of tag order', () => {
      const cardData1 = {
        userId: 'user123',
        data: { content: 'test' },
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const cardData2 = {
        userId: 'user123',
        data: { content: 'test' },
        tags: ['tag3', 'tag1', 'tag2'],
      };

      const hash1 = generateCardDataHash(cardData1);
      const hash2 = generateCardDataHash(cardData2);

      expect(hash1).toBe(hash2);
    });

    it('should handle empty tags array', () => {
      const cardData1 = {
        userId: 'user123',
        data: { content: 'test' },
        tags: [],
      };

      const cardData2 = {
        userId: 'user123',
        data: { content: 'test' },
      };

      const hash1 = generateCardDataHash(cardData1);
      const hash2 = generateCardDataHash(cardData2);

      expect(hash1).toBe(hash2);
    });

    it('should handle nested objects consistently', () => {
      const cardData = {
        userId: 'user123',
        data: {
          level1: {
            level2: {
              level3: {
                value: 'deep',
              },
            },
          },
        },
      };

      const hash1 = generateCardDataHash(cardData);
      const hash2 = generateCardDataHash(cardData);

      expect(hash1).toBe(hash2);
    });

    it('should handle arrays in data', () => {
      const cardData1 = {
        userId: 'user123',
        data: {
          options: ['a', 'b', 'c'],
        },
      };

      const cardData2 = {
        userId: 'user123',
        data: {
          options: ['a', 'b', 'd'],
        },
      };

      const hash1 = generateCardDataHash(cardData1);
      const hash2 = generateCardDataHash(cardData2);

      expect(hash1).not.toBe(hash2);
    });

    it('should filter out undefined values', () => {
      const cardData1 = {
        userId: 'user123',
        data: {
          front: 'Question',
          back: 'Answer',
          optional: undefined,
        },
      };

      const cardData2 = {
        userId: 'user123',
        data: {
          front: 'Question',
          back: 'Answer',
        },
      };

      const hash1 = generateCardDataHash(cardData1);
      const hash2 = generateCardDataHash(cardData2);

      expect(hash1).toBe(hash2);
    });
  });
});
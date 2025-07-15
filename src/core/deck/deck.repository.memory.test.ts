import { describe } from '@jest/globals';
import { testDeckRepository } from './deck.repository.generic.test';
import { InMemoryDeckRepository } from './deck.repository.memory';

describe('InMemoryDeckRepository', () => {
  testDeckRepository(async () => {
    return new InMemoryDeckRepository();
  });
});

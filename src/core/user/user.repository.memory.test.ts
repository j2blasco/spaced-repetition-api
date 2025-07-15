import { describe } from '@jest/globals';
import { testUserRepository } from './user.repository.generic.test';
import { InMemoryUserRepository } from './user.repository.memory';

describe('InMemoryUserRepository', () => {
  testUserRepository(async () => {
    return new InMemoryUserRepository();
  });
});

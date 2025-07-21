import { describe } from '@jest/globals';
import { NoSqlDatabaseTesting } from '@j2blasco/ts-crud';
import { NoSqlUserRepository } from './user.repository';
import { testUserRepository } from './user.repository.generic.test';

describe('NoSqlUserRepository', () => {
  // Run the generic test suite
  testUserRepository(async () => {
    const db = new NoSqlDatabaseTesting();
    return new NoSqlUserRepository(db);
  });
});

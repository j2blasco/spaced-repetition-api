import { describe } from '@jest/globals';
import { NoSqlDatabaseTesting } from '@j2blasco/ts-crud';
import { UserRepository } from './user.repository';
import { testUserRepository } from './user.repository.generic.test';

describe('NoSqlUserRepository', () => {
  testUserRepository(async () => {
    const db = new NoSqlDatabaseTesting();
    return new UserRepository(db);
  });
});

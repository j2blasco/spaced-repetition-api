import { NoSqlDatabaseTesting } from '@j2blasco/ts-crud';
import { UserRepository } from './user.repository';
import { testUserRepository } from './user.repository.generic.test';
import { describe } from 'vitest';

describe('NoSqlUserRepository', () => {
  testUserRepository(async () => {
    const db = new NoSqlDatabaseTesting();
    return new UserRepository(db);
  });
});

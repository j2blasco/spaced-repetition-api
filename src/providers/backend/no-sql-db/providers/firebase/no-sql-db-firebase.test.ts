import { describe } from 'vitest';
import { testNoSqlDbTriggers } from '../../core/tests/no-sql-db-triggers.utils.test';
import { testNoSqlDbWrite } from '../../core/tests/no-sql-db-write-document.utils.test';
import { INoSqlDatabase } from '@j2blasco/ts-crud';
import { createNoSqlDatabaseFirebase } from './no-sql-db-firebase';

// Build the concrete Firebase DB directly for these integration tests
const db: INoSqlDatabase = createNoSqlDatabaseFirebase();

describe('no-sql-db firebase', () => {
  describe('Write Tests', () => {
    testNoSqlDbWrite(db);
  });
  describe('Trigger Tests', () => {
    testNoSqlDbTriggers(db);
  });
});

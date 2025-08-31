import { describeTest } from 'src/testing/utils/describe-tests.spec';
import { testNoSqlDbWrite } from '../../core/no-sql-db-spec/no-sql-db-write-document.spec';
import { setEnvironment } from 'src/environment/environment';
import { testNoSqlDbTriggers } from '../../core/no-sql-db-spec/no-sql-db-triggers.spec';

describeTest('e2e', 'NoSqlDatabaseFirebase', () => {
  testNoSqlDbWrite(async () => await setEnvironment('alpha'));
  testNoSqlDbTriggers(async () => await setEnvironment('alpha'));
});

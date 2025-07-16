import { NoSqlDatabaseTesting } from 'src/services/backend/no-sql-db/providers/testing/no-sql-db-testing';
import { noSqlDatabaseInjectionToken } from 'src/services/backend/no-sql-db/core/no-sql-db.injection-token';
import { DependencyInjector } from 'src/services/injector/injector';

export function registerProviders() {
  DependencyInjector.clear();

  DependencyInjector.register(
    noSqlDatabaseInjectionToken,
    new NoSqlDatabaseTesting(),
  );
}

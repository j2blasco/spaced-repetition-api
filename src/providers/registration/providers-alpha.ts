import { NoSqlDatabaseTesting } from 'src/providers/backend/no-sql-db/testing/no-sql-db-testing';
import { DependencyInjector } from 'src/providers/injector/injector';
import { noSqlDatabaseInjectionToken } from '../backend/no-sql-db/core/no-sql-db.injection-token';

export function registerProviders() {
  DependencyInjector.clear();

  DependencyInjector.register(
    noSqlDatabaseInjectionToken,
    new NoSqlDatabaseTesting(),
  );
}

import { NoSqlDatabaseTesting } from 'src/providers/backend/no-sql-db/testing/no-sql-db-testing';
import { DependencyInjector } from 'src/providers/injector/injector';
import { noSqlDatabaseInjectionToken } from '../backend/no-sql-db/core/no-sql-db.injection-token';
import { spacedRepetitionSchedulerInjectionToken } from '../spaced-repetition-algorithm/core/space-repetition.injection-token';
import { DefaultSpacedRepetitionAlgorithmProvider } from '../spaced-repetition-algorithm/providers/default-algorithm-provider';

export function registerProviders() {
  DependencyInjector.clear();

  DependencyInjector.register(
    noSqlDatabaseInjectionToken,
    new NoSqlDatabaseTesting(),
  );

  DependencyInjector.register(
    spacedRepetitionSchedulerInjectionToken,
    new DefaultSpacedRepetitionAlgorithmProvider(),
  );
}

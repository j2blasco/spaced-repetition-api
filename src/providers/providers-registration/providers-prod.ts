import { DependencyInjector } from 'src/providers/injector/injector';
import { noSqlDatabaseInjectionToken } from '../backend/no-sql-db/core/no-sql-db.injection-token';
import { spacedRepetitionSchedulerInjectionToken } from '../spaced-repetition-algorithm/core/space-repetition.injection-token';
import { DefaultSpacedRepetitionAlgorithmProvider } from '../spaced-repetition-algorithm/providers/default-algorithm-provider';
import { createNoSqlDatabaseFirebase } from '../backend/no-sql-db/providers/firebase/no-sql-db-firebase';

export function registerProviders() {
  DependencyInjector.clear();

  DependencyInjector.register(
    noSqlDatabaseInjectionToken,
    createNoSqlDatabaseFirebase(),
  );

  DependencyInjector.register(
    spacedRepetitionSchedulerInjectionToken,
    new DefaultSpacedRepetitionAlgorithmProvider(),
  );
}

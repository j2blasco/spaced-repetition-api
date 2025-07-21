import { DependencyInjector } from 'src/providers/injector/injector';
import { ICardRepository } from './card.interface';
import { CardRepository } from './card.repository';
import { noSqlDatabaseInjectionToken } from 'src/providers/backend/no-sql-db/core/no-sql-db.injection-token';
import { spacedRepetitionSchedulerInjectionToken } from 'src/providers/spaced-repetition-algorithm/core/space-repetition.injection-token';

let repo: ICardRepository | undefined;

export function getCardRepository(): ICardRepository {
  repo ??= new CardRepository(
    DependencyInjector.inject(noSqlDatabaseInjectionToken),
    DependencyInjector.inject(spacedRepetitionSchedulerInjectionToken),
  );
  return repo;
}

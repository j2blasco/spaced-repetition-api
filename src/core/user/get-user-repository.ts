import { DependencyInjector } from 'src/providers/injector/injector';
import { noSqlDatabaseInjectionToken } from 'src/providers/backend/no-sql-db/core/no-sql-db.injection-token';
import { UserRepository } from './user.repository';
import { IUserRepository } from './user.interface';

let repo: IUserRepository | undefined;

export function getUserRepository(): IUserRepository {
  repo ??= new UserRepository(
    DependencyInjector.inject(noSqlDatabaseInjectionToken),
  );
  return repo;
}

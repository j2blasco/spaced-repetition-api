import { InjectToken } from 'src/providers/injector/injector';
import { INoSqlDatabase } from './no-sql-db.interface';

export const noSqlDatabaseInjectionToken = new InjectToken<INoSqlDatabase>(
  'INoSqlDatabase',
);

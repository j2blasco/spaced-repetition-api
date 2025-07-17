import { InjectToken } from 'src/services/injector/injector';
import { ISpacedRepetitionSchedulerService } from './space-repetition-scheduler-service.interface';

export const spacedRepetitionSchedulerInjectionToken =
  new InjectToken<ISpacedRepetitionSchedulerService>(
    'ISpacedRepetitionSchedulerService',
  );

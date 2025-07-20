import { InjectToken } from 'src/providers/injector/injector';
import { ISpacedRepetition } from './space-repetition.interface';

export const spacedRepetitionSchedulerInjectionToken =
  new InjectToken<ISpacedRepetition>('ISpacedRepetitionSchedulerService');

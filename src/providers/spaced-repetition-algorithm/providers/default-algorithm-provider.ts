import { ISpacedRepetition } from '../core/space-repetition.interface';
import {
  AlgorithmType,
  ISpacedRepetitionScheduler,
} from '../core/spaced-repetition-scheduler.interface';
import { ModifiedSM2Scheduler } from './modified-sm2/modified-sm2-scheduler';
// import { SM2Scheduler } from './sm2/sm2-scheduler';

/**
 * Default implementation of SpacedRepetitionAlgorithmProvider
 * Supports SM2 algorithm out of the box and allows registration of additional algorithms
 */
export class DefaultSpacedRepetitionAlgorithmProvider
  implements ISpacedRepetition
{
  private readonly schedulers = new Map<
    AlgorithmType,
    ISpacedRepetitionScheduler<unknown>
  >();

  constructor() {
    // this.registerScheduler(new SM2Scheduler());
    this.registerScheduler(
      new ModifiedSM2Scheduler({
        failedCards: {
          repeatBeforeGrade: 1,
        },
      }),
    );
  }

  /**
   * Get a scheduler for a specific algorithm type
   */
  getScheduler<TAlgorithmData = unknown>(
    algorithmType: AlgorithmType,
  ): ISpacedRepetitionScheduler<TAlgorithmData> {
    const scheduler = this.schedulers.get(algorithmType);
    if (!scheduler) {
      throw new Error(`Algorithm '${algorithmType}' is not supported`);
    }
    return scheduler as ISpacedRepetitionScheduler<TAlgorithmData>;
  }

  /**
   * Get all supported algorithm types
   */
  getSupportedAlgorithms(): AlgorithmType[] {
    return Array.from(this.schedulers.keys());
  }

  /**
   * Check if an algorithm is supported
   */
  isAlgorithmSupported(algorithmType: AlgorithmType): boolean {
    return this.schedulers.has(algorithmType);
  }

  /**
   * Register a new scheduler implementation
   */
  registerScheduler<TAlgorithmData = unknown>(
    scheduler: ISpacedRepetitionScheduler<TAlgorithmData>,
  ): void {
    this.schedulers.set(scheduler.algorithmType, scheduler);
  }
}

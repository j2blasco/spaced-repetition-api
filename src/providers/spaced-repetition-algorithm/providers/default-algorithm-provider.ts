import { ISpacedRepetitionSchedulerService } from '../core/space-repetition-scheduler-service.interface';
import {
  AlgorithmType,
  ISpacedRepetitionScheduler,
} from '../core/spaced-repetition-algorithm.interface';
import { SM2Scheduler } from './sm2/sm2-scheduler';

/**
 * Default implementation of SpacedRepetitionAlgorithmProvider
 * Supports SM2 algorithm out of the box and allows registration of additional algorithms
 */
export class DefaultSpacedRepetitionAlgorithmProvider
  implements ISpacedRepetitionSchedulerService
{
  private readonly schedulers = new Map<
    AlgorithmType,
    ISpacedRepetitionScheduler<unknown>
  >();

  constructor() {
    // Register SM2 scheduler by default
    this.registerScheduler(new SM2Scheduler());
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

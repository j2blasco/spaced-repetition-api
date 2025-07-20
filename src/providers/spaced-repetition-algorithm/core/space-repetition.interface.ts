import {
  AlgorithmType,
  ISpacedRepetitionScheduler,
} from './spaced-repetition-scheduler.interface';

export interface ISpacedRepetition {
  /**
   * Get a scheduler for a specific algorithm type
   */
  getScheduler<TAlgorithmData = unknown>(
    algorithmType: AlgorithmType,
  ): ISpacedRepetitionScheduler<TAlgorithmData>;

  /**
   * Get all supported algorithm types
   */
  getSupportedAlgorithms(): AlgorithmType[];

  /**
   * Check if an algorithm is supported
   */
  isAlgorithmSupported(algorithmType: AlgorithmType): boolean;

  /**
   * Register a new scheduler implementation
   */
  registerScheduler<TAlgorithmData = unknown>(
    scheduler: ISpacedRepetitionScheduler<TAlgorithmData>,
  ): void;
}

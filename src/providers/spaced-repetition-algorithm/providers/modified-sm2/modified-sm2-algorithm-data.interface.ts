import { SM2AlgorithmData } from '../sm2/sm2-algorithm-data.interface';

/**
 * Modified SM2 algorithm-specific data structure
 * Extends the base SM2 data with failed card repetition tracking
 */
export interface ModifiedSM2AlgorithmData extends SM2AlgorithmData {
  /** Whether the card is currently in a failed state requiring repetition */
  isFailed?: boolean;
  /** Number of successful non-failed recalls needed before the card can be graded as failed */
  recallsNeededBeforeFailGrade?: number;
}

/**
 * Configuration options for the Modified SM2 algorithm
 */
export interface ModifiedSM2Options {
  /** Configuration for failed cards */
  failedCards?: {
    /** Number of successful recalls required before grading a card as failed */
    repeatBeforeGrade?: number;
  };
}

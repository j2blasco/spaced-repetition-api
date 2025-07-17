import { JsonObject } from '@j2blasco/ts-crud/types/utils/json-type';

export enum RecallLevel {
  HARD = 'hard',
  MEDIUM = 'medium',
  EASY = 'easy',
}

export enum AlgorithmType {
  SM2 = 'sm2',
  SM4 = 'sm4',
  FSRS = 'fsrs',
}

export type CardSchedulingData<TAlgorithmData = unknown> = {
  algorithmType: AlgorithmType;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  algorithmData: TAlgorithmData; // algorithm-specific parameters
};

export type ReviewResult = {
  recallLevel: RecallLevel;
  responseTime?: number; // in seconds
  reviewedAt: Date;
};

export type RescheduleRequest<TAlgorithmData = unknown> = {
  currentScheduling: CardSchedulingData<TAlgorithmData>;
  reviewResult: ReviewResult;
};

export type RescheduleResponse<TAlgorithmData = unknown> = {
  newScheduling: CardSchedulingData<TAlgorithmData>;
  wasSuccessful: boolean;
};

/**
 * Interface for individual algorithm schedulers
 * Each algorithm (SM2, SM4, FSRS) implements this interface
 */
export interface ISpacedRepetitionScheduler<TAlgorithmData = unknown> {
  /**
   * The algorithm type this scheduler implements
   */
  readonly algorithmType: AlgorithmType;

  /**
   * Reschedule a card based on review performance
   */
  reschedule(
    request: RescheduleRequest<TAlgorithmData>,
  ): RescheduleResponse<TAlgorithmData>;

  /**
   * Initialize scheduling data for a new card
   */
  initializeCard(): CardSchedulingData<TAlgorithmData>;

  /**
   * Serialize scheduling data to JSON for storage
   */
  serializeSchedulingData(data: CardSchedulingData<TAlgorithmData>): JsonObject;

  /**
   * Deserialize scheduling data from JSON storage
   */
  deserializeSchedulingData(
    data: JsonObject,
  ): CardSchedulingData<TAlgorithmData>;

  /**
   * Validate that the scheduling data is compatible with this algorithm
   */
  isCompatibleSchedulingData(data: CardSchedulingData<TAlgorithmData>): boolean;

  /**
   * Migrate scheduling data from another algorithm to this one
   * Returns null if migration is not possible
   */
  migrateFromAlgorithm(
    data: CardSchedulingData<unknown>,
    sourceAlgorithm: AlgorithmType,
  ): CardSchedulingData<TAlgorithmData> | null;
}

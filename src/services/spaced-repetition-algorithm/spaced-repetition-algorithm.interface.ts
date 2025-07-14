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

export interface CardSchedulingData<TAlgorithmData = unknown> {
  nextReviewDate: Date;
  lastReviewDate?: Date;
  algorithmData: TAlgorithmData; // algorithm-specific parameters
}

export interface ReviewResult {
  recallLevel: RecallLevel;
  responseTime?: number; // in seconds
  reviewedAt: Date;
}

export interface RescheduleRequest<TAlgorithmData = unknown> {
  currentScheduling: CardSchedulingData<TAlgorithmData>;
  reviewResult: ReviewResult;
}

export interface RescheduleResponse<TAlgorithmData = unknown> {
  newScheduling: CardSchedulingData<TAlgorithmData>;
  wasSuccessful: boolean;
}

/**
 * Interface for individual algorithm schedulers
 * Each algorithm (SM2, SM4, FSRS) implements this interface
 */
export interface SpacedRepetitionScheduler<TAlgorithmData = unknown> {
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

/**
 * Provider interface for managing multiple spaced repetition algorithms
 */
export interface SpacedRepetitionAlgorithmProvider {
  /**
   * Get a scheduler for a specific algorithm type
   */
  getScheduler<TAlgorithmData = unknown>(
    algorithmType: AlgorithmType,
  ): SpacedRepetitionScheduler<TAlgorithmData>;

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
    scheduler: SpacedRepetitionScheduler<TAlgorithmData>,
  ): void;
}

import { JsonObject } from '@j2blasco/ts-crud';
import {
  ISpacedRepetitionScheduler,
  AlgorithmType,
  CardSchedulingData,
  RescheduleRequest,
  RescheduleResponse,
  RecallLevel,
} from '../../core/spaced-repetition-algorithm.interface';
import { updateSchedulingWithInterval } from '../scheduling-utils';
import { SM2AlgorithmData } from './sm2-algorithm-data.interface';

/**
 * SuperMemo 2 (SM-2) algorithm implementation
 * Maps our RecallLevel enum to SuperMemo grades and implements the classic SM-2 algorithm
 */
export class SM2Scheduler
  implements ISpacedRepetitionScheduler<SM2AlgorithmData>
{
  readonly algorithmType = AlgorithmType.SM2;

  /**
   * Initialize a new card with SM2 default values
   */
  initializeCard(): CardSchedulingData<SM2AlgorithmData> {
    const now = new Date();
    const nextReviewDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day

    return {
      algorithmType: this.algorithmType,
      nextReviewDate,
      algorithmData: {
        efactor: 2.5, // Default ease factor
        repetition: 0, // New card
      },
    };
  }

  /**
   * Serialize scheduling data to JSON for storage
   */
  serializeSchedulingData(
    data: CardSchedulingData<SM2AlgorithmData>,
  ): JsonObject {
    return {
      algorithmType: data.algorithmType,
      nextReviewDate: data.nextReviewDate.toISOString(),
      lastReviewDate: data.lastReviewDate?.toISOString() || null,
      algorithmData: {
        efactor: data.algorithmData.efactor,
        repetition: data.algorithmData.repetition,
      },
    };
  }

  /**
   * Deserialize scheduling data from JSON storage
   */
  deserializeSchedulingData(
    data: JsonObject,
  ): CardSchedulingData<SM2AlgorithmData> {
    const algorithmData = data.algorithmData as {
      efactor: number;
      repetition: number;
    };

    return {
      algorithmType: data.algorithmType as AlgorithmType,
      nextReviewDate: new Date(data.nextReviewDate as string),
      lastReviewDate: data.lastReviewDate
        ? new Date(data.lastReviewDate as string)
        : undefined,
      algorithmData: {
        efactor: algorithmData.efactor,
        repetition: algorithmData.repetition,
      },
    };
  }

  /**
   * Reschedule a card based on review performance
   */
  reschedule(
    request: RescheduleRequest<SM2AlgorithmData>,
  ): RescheduleResponse<SM2AlgorithmData> {
    const grade = this.mapRecallLevelToGrade(request.reviewResult.recallLevel);
    const currentData = request.currentScheduling.algorithmData;

    const updatedItem = this.applySM2Algorithm(
      {
        interval: 1, // Not used in calculation, just for interface compatibility
        repetition: currentData.repetition,
        efactor: currentData.efactor,
      },
      grade,
    );

    const newScheduling = updateSchedulingWithInterval(
      {
        ...request.currentScheduling,
        algorithmData: {
          efactor: updatedItem.efactor,
          repetition: updatedItem.repetition,
        },
      },
      updatedItem.interval,
      request.reviewResult.reviewedAt,
    );

    return {
      newScheduling,
      wasSuccessful: grade >= 3,
    };
  }

  /**
   * Check if scheduling data is compatible with SM2
   */
  isCompatibleSchedulingData(
    data: CardSchedulingData<SM2AlgorithmData>,
  ): boolean {
    const algorithmData = data.algorithmData;

    return (
      typeof algorithmData === 'object' &&
      algorithmData !== null &&
      typeof algorithmData.efactor === 'number' &&
      typeof algorithmData.repetition === 'number' &&
      algorithmData.efactor >= 1.3 &&
      algorithmData.repetition >= 0 &&
      Number.isInteger(algorithmData.repetition)
    );
  }

  /**
   * Migrate scheduling data from another algorithm to SM2
   */
  migrateFromAlgorithm(
    data: CardSchedulingData<unknown>,
    sourceAlgorithm: AlgorithmType,
  ): CardSchedulingData<SM2AlgorithmData> | null {
    // If it's already SM2, validate and return
    if (sourceAlgorithm === AlgorithmType.SM2) {
      try {
        const sm2Data = data as CardSchedulingData<SM2AlgorithmData>;
        return this.isCompatibleSchedulingData(sm2Data) ? sm2Data : null;
      } catch {
        return null;
      }
    }

    // For other algorithms, create a new SM2 card with reasonable defaults
    // This is a basic migration - could be enhanced with more sophisticated mapping
    return {
      algorithmType: this.algorithmType,
      nextReviewDate: data.nextReviewDate,
      lastReviewDate: data.lastReviewDate,
      algorithmData: {
        efactor: 2.5, // Default ease factor
        repetition: 1, // Assume some progress was made
      },
    };
  }

  /**
   * Map our RecallLevel enum to SuperMemo grades (0-5)
   */
  private mapRecallLevelToGrade(recallLevel: RecallLevel): number {
    switch (recallLevel) {
      case RecallLevel.HARD:
        return 2; // Failure - will reset repetition
      case RecallLevel.MEDIUM:
        return 3; // Successful but difficult
      case RecallLevel.EASY:
        return 5; // Perfect recall
      default:
        return 3; // Default to medium
    }
  }

  /**
   * Apply the SuperMemo 2 algorithm
   * Based on the original SM-2 algorithm
   */
  private applySM2Algorithm(
    item: { interval: number; repetition: number; efactor: number },
    grade: number,
  ): { interval: number; repetition: number; efactor: number } {
    let nextInterval: number;
    let nextRepetition: number;
    let nextEfactor: number;

    if (grade >= 3) {
      if (item.repetition === 0) {
        nextInterval = 1;
        nextRepetition = 1;
      } else if (item.repetition === 1) {
        nextInterval = 6;
        nextRepetition = 2;
      } else {
        nextInterval = Math.round(item.interval * item.efactor);
        nextRepetition = item.repetition + 1;
      }
    } else {
      nextInterval = 1;
      nextRepetition = 0;
    }

    nextEfactor =
      item.efactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

    if (nextEfactor < 1.3) nextEfactor = 1.3;

    return {
      interval: nextInterval,
      repetition: nextRepetition,
      efactor: nextEfactor,
    };
  }
}

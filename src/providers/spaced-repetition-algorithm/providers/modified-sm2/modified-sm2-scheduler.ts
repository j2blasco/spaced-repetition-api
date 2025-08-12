import { JsonObject } from '@j2blasco/ts-crud';
import {
  ISpacedRepetitionScheduler,
  AlgorithmType,
  CardSchedulingData,
  RescheduleRequest,
  RescheduleResponse,
  RecallLevel,
} from '../../core/spaced-repetition-scheduler.interface';
import { SM2Scheduler } from '../sm2/sm2-scheduler';
import { SM2AlgorithmData } from '../sm2/sm2-algorithm-data.interface';
import {
  ModifiedSM2AlgorithmData,
  ModifiedSM2Options,
} from './modified-sm2-algorithm-data.interface';

export class ModifiedSM2Scheduler
  implements ISpacedRepetitionScheduler<ModifiedSM2AlgorithmData>
{
  readonly algorithmType = AlgorithmType.SM2;
  private options: ModifiedSM2Options;
  private sm2Scheduler: SM2Scheduler;

  constructor(options: ModifiedSM2Options = {}) {
    this.options = {
      failedCards: {
        repeatBeforeGrade: 4,
        ...options.failedCards,
      },
    };
    this.sm2Scheduler = new SM2Scheduler();
  }

  initializeCard(): CardSchedulingData<ModifiedSM2AlgorithmData> {
    const now = new Date();
  const nextReviewDate = new Date(now.getTime() + 45 * 1000);

    return {
      algorithmType: this.algorithmType,
      nextReviewDate,
      lastReviewDate: null,
      algorithmData: {
        efactor: 2.5,
        repetition: 0,
        isFailed: false,
        recallsNeededBeforeFailGrade: 0,
      },
    };
  }

  serializeSchedulingData(
    data: CardSchedulingData<ModifiedSM2AlgorithmData>,
  ): JsonObject {
    return {
      algorithmType: data.algorithmType,
      nextReviewDate: data.nextReviewDate.toISOString(),
      lastReviewDate: data.lastReviewDate ? data.lastReviewDate.toISOString() : null,
      algorithmData: {
        efactor: data.algorithmData.efactor,
        repetition: data.algorithmData.repetition,
        isFailed: data.algorithmData.isFailed ?? false,
        recallsNeededBeforeFailGrade:
          data.algorithmData.recallsNeededBeforeFailGrade ?? 0,
      },
    };
  }

  deserializeSchedulingData(
    data: JsonObject,
  ): CardSchedulingData<ModifiedSM2AlgorithmData> {
    const algorithmData = data.algorithmData as {
      efactor: number;
      repetition: number;
      isFailed?: boolean;
      recallsNeededBeforeFailGrade?: number;
    };

    return {
      algorithmType: data.algorithmType as AlgorithmType,
      nextReviewDate: new Date(data.nextReviewDate as string),
      lastReviewDate: data.lastReviewDate ? new Date(data.lastReviewDate as string) : null,
      algorithmData: {
        efactor: algorithmData.efactor,
        repetition: algorithmData.repetition,
        isFailed: algorithmData.isFailed ?? false,
        recallsNeededBeforeFailGrade:
          algorithmData.recallsNeededBeforeFailGrade ?? 0,
      },
    };
  }

  reschedule(
    request: RescheduleRequest<ModifiedSM2AlgorithmData>,
  ): RescheduleResponse<ModifiedSM2AlgorithmData> {
    const recallLevel = request.reviewResult.recallLevel;
    const currentData = request.currentScheduling.algorithmData;
    const isFailed = recallLevel === RecallLevel.HARD;

    if (currentData.isFailed) {
      return this.handleFailedCardReview(request, isFailed);
    }

    if (isFailed) {
      return this.handleInitialFailure(request);
    }

    return this.handleSuccessfulReview(request);
  }

  private handleFailedCardReview(
    request: RescheduleRequest<ModifiedSM2AlgorithmData>,
    isFailed: boolean,
  ): RescheduleResponse<ModifiedSM2AlgorithmData> {
    const currentData = request.currentScheduling.algorithmData;
    const recallsNeeded = currentData.recallsNeededBeforeFailGrade ?? 0;

    if (isFailed) {
      const newScheduling: CardSchedulingData<ModifiedSM2AlgorithmData> = {
        ...request.currentScheduling,
        // Failed again while already in failed state: schedule 45s in the future
        nextReviewDate: new Date(
          request.reviewResult.reviewedAt.getTime() + 45 * 1000,
        ),
        lastReviewDate: request.reviewResult.reviewedAt,
        algorithmData: {
          ...currentData,
          isFailed: true,
          recallsNeededBeforeFailGrade:
            this.options.failedCards?.repeatBeforeGrade ?? 4,
        },
      };

      return {
        newScheduling,
        wasSuccessful: false,
      };
    } else {
      const newRecallsNeeded = Math.max(0, recallsNeeded - 1);

      if (newRecallsNeeded === 0) {
        return this.gradeAsFailedAndReschedule(request);
      } else {
        const newScheduling: CardSchedulingData<ModifiedSM2AlgorithmData> = {
          ...request.currentScheduling,
          // Successful recall while in failed state: schedule 45s in the future until grading occurs
          nextReviewDate: new Date(
            request.reviewResult.reviewedAt.getTime() + 45 * 1000,
          ),
          lastReviewDate: request.reviewResult.reviewedAt,
          algorithmData: {
            ...currentData,
            isFailed: true,
            recallsNeededBeforeFailGrade: newRecallsNeeded,
          },
        };

        return {
          newScheduling,
          wasSuccessful: false,
        };
      }
    }
  }

  private handleInitialFailure(
    request: RescheduleRequest<ModifiedSM2AlgorithmData>,
  ): RescheduleResponse<ModifiedSM2AlgorithmData> {
    const currentData = request.currentScheduling.algorithmData;

    const newScheduling: CardSchedulingData<ModifiedSM2AlgorithmData> = {
      ...request.currentScheduling,
      // Initial failure: schedule 45s in the future
      nextReviewDate: new Date(
        request.reviewResult.reviewedAt.getTime() + 45 * 1000,
      ),
      lastReviewDate: request.reviewResult.reviewedAt,
      algorithmData: {
        ...currentData,
        isFailed: true,
        recallsNeededBeforeFailGrade:
          this.options.failedCards?.repeatBeforeGrade ?? 4,
      },
    };

    return {
      newScheduling,
      wasSuccessful: false,
    };
  }

  private handleSuccessfulReview(
    request: RescheduleRequest<ModifiedSM2AlgorithmData>,
  ): RescheduleResponse<ModifiedSM2AlgorithmData> {
    const currentData = request.currentScheduling.algorithmData;

    const sm2SchedulingData: CardSchedulingData<SM2AlgorithmData> = {
      algorithmType: this.algorithmType,
      nextReviewDate: request.currentScheduling.nextReviewDate,
      lastReviewDate: request.currentScheduling.lastReviewDate,
      algorithmData: {
        efactor: currentData.efactor,
        repetition: currentData.repetition,
      },
    };

    const sm2Request: RescheduleRequest<SM2AlgorithmData> = {
      currentScheduling: sm2SchedulingData,
      reviewResult: request.reviewResult,
    };

    const sm2Response = this.sm2Scheduler.reschedule(sm2Request);

    const newScheduling: CardSchedulingData<ModifiedSM2AlgorithmData> = {
      ...sm2Response.newScheduling,
      algorithmData: {
        efactor: sm2Response.newScheduling.algorithmData.efactor,
        repetition: sm2Response.newScheduling.algorithmData.repetition,
        isFailed: false,
        recallsNeededBeforeFailGrade: 0,
      },
    };

    return {
      newScheduling,
      wasSuccessful: true,
    };
  }

  private gradeAsFailedAndReschedule(
    request: RescheduleRequest<ModifiedSM2AlgorithmData>,
  ): RescheduleResponse<ModifiedSM2AlgorithmData> {
    const currentData = request.currentScheduling.algorithmData;

    const sm2SchedulingData: CardSchedulingData<SM2AlgorithmData> = {
      algorithmType: this.algorithmType,
      nextReviewDate: request.currentScheduling.nextReviewDate,
      lastReviewDate: request.currentScheduling.lastReviewDate,
      algorithmData: {
        efactor: currentData.efactor,
        repetition: currentData.repetition,
      },
    };

    const sm2Request: RescheduleRequest<SM2AlgorithmData> = {
      currentScheduling: sm2SchedulingData,
      reviewResult: {
        ...request.reviewResult,
        recallLevel: RecallLevel.HARD,
      },
    };

    const sm2Response = this.sm2Scheduler.reschedule(sm2Request);

    const newScheduling: CardSchedulingData<ModifiedSM2AlgorithmData> = {
      ...sm2Response.newScheduling,
      algorithmData: {
        efactor: sm2Response.newScheduling.algorithmData.efactor,
        repetition: sm2Response.newScheduling.algorithmData.repetition,
        isFailed: false,
        recallsNeededBeforeFailGrade: 0,
      },
    };

    return {
      newScheduling,
      wasSuccessful: false,
    };
  }

  isCompatibleSchedulingData(
    data: CardSchedulingData<ModifiedSM2AlgorithmData>,
  ): boolean {
    const algorithmData = data.algorithmData;

    const baseValid =
      typeof algorithmData === 'object' &&
      algorithmData !== null &&
      typeof algorithmData.efactor === 'number' &&
      typeof algorithmData.repetition === 'number' &&
      algorithmData.efactor >= 1.3 &&
      algorithmData.repetition >= 0 &&
      Number.isInteger(algorithmData.repetition);

    if (!baseValid) return false;

    const isFailedValid =
      algorithmData.isFailed === undefined ||
      typeof algorithmData.isFailed === 'boolean';

    const recallsNeededValid =
      algorithmData.recallsNeededBeforeFailGrade === undefined ||
      (typeof algorithmData.recallsNeededBeforeFailGrade === 'number' &&
        algorithmData.recallsNeededBeforeFailGrade >= 0 &&
        Number.isInteger(algorithmData.recallsNeededBeforeFailGrade));

    return isFailedValid && recallsNeededValid;
  }

  migrateFromAlgorithm(
    data: CardSchedulingData<unknown>,
    sourceAlgorithm: AlgorithmType,
  ): CardSchedulingData<ModifiedSM2AlgorithmData> | null {
    if (sourceAlgorithm === AlgorithmType.SM2) {
      try {
        const sm2Data = data as CardSchedulingData<ModifiedSM2AlgorithmData>;
        if (this.isCompatibleSchedulingData(sm2Data)) {
          return {
            ...sm2Data,
            algorithmData: {
              ...sm2Data.algorithmData,
              isFailed: sm2Data.algorithmData.isFailed ?? false,
              recallsNeededBeforeFailGrade:
                sm2Data.algorithmData.recallsNeededBeforeFailGrade ?? 0,
            },
          };
        }
        return null;
      } catch {
        return null;
      }
    }

    return {
      algorithmType: this.algorithmType,
      nextReviewDate: data.nextReviewDate,
      algorithmData: {
        efactor: 2.5,
        repetition: 1,
        isFailed: false,
        recallsNeededBeforeFailGrade: 0,
      },
    };
  }

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

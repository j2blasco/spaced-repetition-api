import { describe, beforeEach, it, expect } from 'vitest';
import { ModifiedSM2Scheduler } from './modified-sm2-scheduler';
import {
  AlgorithmType,
  RecallLevel,
  CardSchedulingData,
  RescheduleRequest,
} from '../../core/spaced-repetition-scheduler.interface';
import { ModifiedSM2AlgorithmData } from './modified-sm2-algorithm-data.interface';

describe('ModifiedSM2Scheduler', () => {
  let scheduler: ModifiedSM2Scheduler;
  const baseDate = new Date('2023-01-01T00:00:00.000Z');

  beforeEach(() => {
    scheduler = new ModifiedSM2Scheduler({
      failedCards: { repeatBeforeGrade: 4 },
    });
  });

  describe('initializeCard', () => {
    it('should initialize a new card with default values', () => {
      const card = scheduler.initializeCard();

      expect(card.algorithmType).toBe(AlgorithmType.SM2);
      expect(card.algorithmData.efactor).toBe(2.5);
      expect(card.algorithmData.repetition).toBe(0);
      expect(card.algorithmData.isFailed).toBe(false);
      expect(card.algorithmData.recallsNeededBeforeFailGrade).toBe(0);
    });
  });

  describe('serialization and deserialization', () => {
    it('should serialize and deserialize scheduling data correctly', () => {
      const originalData: CardSchedulingData<ModifiedSM2AlgorithmData> = {
        algorithmType: AlgorithmType.SM2,
        nextReviewDate: baseDate,
  lastReviewDate: null,
        algorithmData: {
          efactor: 2.3,
          repetition: 2,
          isFailed: true,
          recallsNeededBeforeFailGrade: 3,
        },
      };

      const serialized = scheduler.serializeSchedulingData(originalData);
      const deserialized = scheduler.deserializeSchedulingData(serialized);

      expect(deserialized).toEqual(originalData);
    });

    it('should handle missing optional fields during deserialization', () => {
      const serializedWithoutOptionals = {
        algorithmType: AlgorithmType.SM2,
        nextReviewDate: baseDate.toISOString(),
        algorithmData: {
          efactor: 2.3,
          repetition: 2,
        },
      };

      const deserialized = scheduler.deserializeSchedulingData(
        serializedWithoutOptionals,
      );

      expect(deserialized.algorithmData.isFailed).toBe(false);
      expect(deserialized.algorithmData.recallsNeededBeforeFailGrade).toBe(0);
    });
  });

  describe('failed card repetition logic', () => {
    it('should schedule +45s for every failed-state repetition across repeatBeforeGrade variants', () => {
      const variants = [1, 2, 3, 5];
      for (const repeatBeforeGrade of variants) {
        const schedulerVariant = new ModifiedSM2Scheduler({
          failedCards: { repeatBeforeGrade },
        });
        let current = schedulerVariant.initializeCard();
        const reviewedAtBase = new Date(baseDate.getTime() + 1000);

        // Initial failure
        let response = schedulerVariant.reschedule({
          currentScheduling: current,
          reviewResult: {
            recallLevel: RecallLevel.HARD,
            reviewedAt: reviewedAtBase,
          },
        });
        expect(response.newScheduling.nextReviewDate.getTime()).toBe(
          reviewedAtBase.getTime() + 45 * 1000,
        );
        expect(
          response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
        ).toBe(repeatBeforeGrade);
        current = response.newScheduling;

        // Interim recalls while still failed
        for (let remaining = repeatBeforeGrade; remaining > 1; remaining--) {
          const stepTime = new Date(
            reviewedAtBase.getTime() + remaining * 1000,
          );
          response = schedulerVariant.reschedule({
            currentScheduling: current,
            reviewResult: {
              recallLevel: RecallLevel.EASY,
              reviewedAt: stepTime,
            },
          });
          expect(response.wasSuccessful).toBe(false);
          expect(response.newScheduling.algorithmData.isFailed).toBe(true);
          expect(
            response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
          ).toBe(remaining - 1);
          expect(response.newScheduling.nextReviewDate.getTime()).toBe(
            stepTime.getTime() + 45 * 1000,
          );
          current = response.newScheduling;
        }

        // Final recall exits failed state
        const finalTime = new Date(
          reviewedAtBase.getTime() + (repeatBeforeGrade + 2) * 1000,
        );
        response = schedulerVariant.reschedule({
          currentScheduling: current,
          reviewResult: {
            recallLevel: RecallLevel.EASY,
            reviewedAt: finalTime,
          },
        });
        expect(response.newScheduling.algorithmData.isFailed).toBe(false);
        expect(
          response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
        ).toBe(0);
        expect(response.newScheduling.nextReviewDate.getTime()).toBeGreaterThan(
          finalTime.getTime(),
        );
      }
    });
    it('should implement the complete failed card flow as described in requirements', () => {
      // Start with a new card
      let currentScheduling = scheduler.initializeCard();
      const reviewedAt = new Date(baseDate.getTime() + 1000); // 1 second later

      // 1. Review card as easy -> scheduled into the future
      let request: RescheduleRequest<ModifiedSM2AlgorithmData> = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      let response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(true);
      expect(response.newScheduling.algorithmData.isFailed).toBe(false);
      expect(response.newScheduling.nextReviewDate.getTime()).toBeGreaterThan(
        reviewedAt.getTime(),
      );

      currentScheduling = response.newScheduling;

  // 2. Review card as failed -> scheduled 45s later (4 recalls needed)
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.HARD,
          reviewedAt,
        },
      };

      response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(false);
      expect(response.newScheduling.algorithmData.isFailed).toBe(true);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(4);
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

  // 3. Review card as easy -> scheduled 45s later (3 recalls needed)
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(false); // Still in failed state
      expect(response.newScheduling.algorithmData.isFailed).toBe(true);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(3);
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

  // 4. Review card as easy -> scheduled 45s later (2 recalls needed)
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(false); // Still in failed state
      expect(response.newScheduling.algorithmData.isFailed).toBe(true);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(2);
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

  // 5. Review card as failed -> scheduled 45s later (4 recalls needed - reset)
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.HARD,
          reviewedAt,
        },
      };

      response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(false);
      expect(response.newScheduling.algorithmData.isFailed).toBe(true);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(4); // Reset to 4
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

  // 6. Review card as easy -> scheduled 45s later (3 recalls needed)
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(false); // Still in failed state
      expect(response.newScheduling.algorithmData.isFailed).toBe(true);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(3);
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

  // 7. Review card as easy -> scheduled 45s later (2 recalls needed)
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(false); // Still in failed state
      expect(response.newScheduling.algorithmData.isFailed).toBe(true);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(2);
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

  // 8. Review card as easy -> scheduled 45s later (1 recall needed)
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(false); // Still in failed state
      expect(response.newScheduling.algorithmData.isFailed).toBe(true);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(1);
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

      // 9. Review card as easy -> The card is now graded as failed and rescheduled
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      response = scheduler.reschedule(request);
      expect(response.wasSuccessful).toBe(false); // Was graded as failed
      expect(response.newScheduling.algorithmData.isFailed).toBe(false); // No longer in failed state
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(0);
      expect(response.newScheduling.algorithmData.repetition).toBe(0); // Reset due to failure
      expect(response.newScheduling.nextReviewDate.getTime()).toBeGreaterThan(
        reviewedAt.getTime(),
      ); // Scheduled for future
    });

    it('should handle different repeatBeforeGrade values', () => {
      const customScheduler = new ModifiedSM2Scheduler({
        failedCards: { repeatBeforeGrade: 2 },
      });
      let currentScheduling = customScheduler.initializeCard();
      const reviewedAt = new Date(baseDate.getTime() + 1000);

      // Review as failed
      let request: RescheduleRequest<ModifiedSM2AlgorithmData> = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.HARD,
          reviewedAt,
        },
      };

      let response = customScheduler.reschedule(request);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(2);
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

      // First successful recall
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      response = customScheduler.reschedule(request);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(1);
      expect(response.newScheduling.algorithmData.isFailed).toBe(true);
      expect(response.newScheduling.nextReviewDate.getTime()).toBe(
        reviewedAt.getTime() + 45 * 1000,
      );

      currentScheduling = response.newScheduling;

      // Second successful recall - should now grade as failed
      request = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      response = customScheduler.reschedule(request);
      expect(response.newScheduling.algorithmData.isFailed).toBe(false);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(0);
      expect(response.wasSuccessful).toBe(false); // Was graded as failed
    });
  });

  describe('successful reviews', () => {
    it('should handle successful reviews of non-failed cards using SM2 algorithm', () => {
      let currentScheduling = scheduler.initializeCard();
      const reviewedAt = new Date(baseDate.getTime() + 1000);

      const request: RescheduleRequest<ModifiedSM2AlgorithmData> = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt,
        },
      };

      const response = scheduler.reschedule(request);

      expect(response.wasSuccessful).toBe(true);
      expect(response.newScheduling.algorithmData.isFailed).toBe(false);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(0);
      expect(response.newScheduling.algorithmData.repetition).toBe(1);
      expect(response.newScheduling.nextReviewDate.getTime()).toBeGreaterThan(
        reviewedAt.getTime(),
      );
    });

    it('should handle medium recall level correctly', () => {
      let currentScheduling = scheduler.initializeCard();
      const reviewedAt = new Date(baseDate.getTime() + 1000);

      const request: RescheduleRequest<ModifiedSM2AlgorithmData> = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.MEDIUM,
          reviewedAt,
        },
      };

      const response = scheduler.reschedule(request);

      expect(response.wasSuccessful).toBe(true);
      expect(response.newScheduling.algorithmData.isFailed).toBe(false);
      expect(response.newScheduling.algorithmData.repetition).toBe(1);
    });
  });

  describe('isCompatibleSchedulingData', () => {
    it('should validate compatible scheduling data', () => {
      const validData: CardSchedulingData<ModifiedSM2AlgorithmData> = {
        algorithmType: AlgorithmType.SM2,
        nextReviewDate: baseDate,
        algorithmData: {
          efactor: 2.5,
          repetition: 1,
          isFailed: false,
          recallsNeededBeforeFailGrade: 0,
        },
      };

      expect(scheduler.isCompatibleSchedulingData(validData)).toBe(true);
    });

    it('should reject invalid efactor', () => {
      const invalidData: CardSchedulingData<ModifiedSM2AlgorithmData> = {
        algorithmType: AlgorithmType.SM2,
        nextReviewDate: baseDate,
        algorithmData: {
          efactor: 1.0, // Too low
          repetition: 1,
          isFailed: false,
          recallsNeededBeforeFailGrade: 0,
        },
      };

  expect(scheduler.isCompatibleSchedulingData(invalidData)).toBe(false);
    });

    it('should reject negative repetition', () => {
      const invalidData: CardSchedulingData<ModifiedSM2AlgorithmData> = {
        algorithmType: AlgorithmType.SM2,
        nextReviewDate: baseDate,
        algorithmData: {
          efactor: 2.5,
          repetition: -1,
          isFailed: false,
          recallsNeededBeforeFailGrade: 0,
        },
      };

      expect(scheduler.isCompatibleSchedulingData(invalidData)).toBe(false);
    });

    it('should accept data with undefined optional fields', () => {
      const dataWithUndefined: CardSchedulingData<ModifiedSM2AlgorithmData> = {
        algorithmType: AlgorithmType.SM2,
        nextReviewDate: baseDate,
        algorithmData: {
          efactor: 2.5,
          repetition: 1,
          isFailed: undefined,
          recallsNeededBeforeFailGrade: undefined,
        } as ModifiedSM2AlgorithmData,
      };

      expect(scheduler.isCompatibleSchedulingData(dataWithUndefined)).toBe(
        true,
      );
    });
  });

  describe('migrateFromAlgorithm', () => {
    it('should migrate from SM2 algorithm', () => {
      const sm2Data = {
        algorithmType: AlgorithmType.SM2,
        nextReviewDate: baseDate,
        algorithmData: {
          efactor: 2.3,
          repetition: 2,
        },
      };

      const migrated = scheduler.migrateFromAlgorithm(
        sm2Data,
        AlgorithmType.SM2,
      );

      expect(migrated).not.toBeNull();
      expect(migrated!.algorithmData.efactor).toBe(2.3);
      expect(migrated!.algorithmData.repetition).toBe(2);
      expect(migrated!.algorithmData.isFailed).toBe(false);
      expect(migrated!.algorithmData.recallsNeededBeforeFailGrade).toBe(0);
    });

    it('should create new card for unknown algorithms', () => {
      const unknownData = {
        algorithmType: 'UNKNOWN' as AlgorithmType,
        nextReviewDate: baseDate,
        algorithmData: {
          someOtherField: 'value',
        },
      };

      const migrated = scheduler.migrateFromAlgorithm(
        unknownData,
        'UNKNOWN' as AlgorithmType,
      );

      expect(migrated).not.toBeNull();
      expect(migrated!.nextReviewDate).toBe(baseDate);
      expect(migrated!.algorithmData.efactor).toBe(2.5);
      expect(migrated!.algorithmData.repetition).toBe(1);
      expect(migrated!.algorithmData.isFailed).toBe(false);
      expect(migrated!.algorithmData.recallsNeededBeforeFailGrade).toBe(0);
    });
  });

  describe('default options', () => {
    it('should use default repeatBeforeGrade value when not specified', () => {
      const defaultScheduler = new ModifiedSM2Scheduler();
      let currentScheduling = defaultScheduler.initializeCard();
      const reviewedAt = new Date(baseDate.getTime() + 1000);

      const request: RescheduleRequest<ModifiedSM2AlgorithmData> = {
        currentScheduling,
        reviewResult: {
          recallLevel: RecallLevel.HARD,
          reviewedAt,
        },
      };

      const response = defaultScheduler.reschedule(request);
      expect(
        response.newScheduling.algorithmData.recallsNeededBeforeFailGrade,
      ).toBe(4); // Default value
    });
  });
});

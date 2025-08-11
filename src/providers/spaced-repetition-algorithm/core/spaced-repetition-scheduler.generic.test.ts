import {
  AlgorithmType,
  CardSchedulingData,
  RecallLevel,
  RescheduleRequest,
  ISpacedRepetitionScheduler,
} from './spaced-repetition-scheduler.interface';
import {
  calculateInterval,
  calculateIntervalChange,
} from '../providers/scheduling-utils';
import { describe, beforeEach, it, expect } from 'vitest';

/**
 * Generic test suite for SpacedRepetitionScheduler implementations
 * This function tests any implementation of the SpacedRepetitionScheduler interface
 */
export function testSpacedRepetitionScheduler(
  createScheduler: () => ISpacedRepetitionScheduler,
  algorithmType: AlgorithmType,
): void {
  describe(`SpacedRepetitionScheduler (${algorithmType})`, () => {
    let scheduler: ISpacedRepetitionScheduler;

    beforeEach(() => {
      scheduler = createScheduler();
    });

    describe('basic properties', () => {
      it('should have the correct algorithm type', () => {
        expect(scheduler.algorithmType).toBe(algorithmType);
      });
    });

    describe('initializeCard', () => {
      it('should create valid initial scheduling data', () => {
        const initialData = scheduler.initializeCard();

        expect(initialData).toBeDefined();
        expect(calculateInterval(initialData)).toBeGreaterThanOrEqual(0);
        expect(initialData.nextReviewDate).toBeInstanceOf(Date);
        expect(initialData.nextReviewDate.getTime()).toBeLessThanOrEqual(
          Date.now(),
        );
        expect(initialData.algorithmData).toBeDefined();
        expect(typeof initialData.algorithmData).toBe('object');
  // New cards should have no lastReviewDate
  expect(initialData.lastReviewDate == null).toBe(true);
      });

      it('should create scheduling data compatible with itself', () => {
        const initialData = scheduler.initializeCard();
        const isCompatible = scheduler.isCompatibleSchedulingData(initialData);

        expect(isCompatible).toBe(true);
      });

      it('should schedule new cards for immediate review', () => {
        const now = new Date();
        const initialData = scheduler.initializeCard();
        expect(initialData.nextReviewDate.getTime()).toBeLessThanOrEqual(
          now.getTime(),
        );
      });
    });

    describe('reschedule', () => {
      let baseSchedulingData: CardSchedulingData;
      let baseRequest: RescheduleRequest;

      beforeEach(() => {
        baseSchedulingData = scheduler.initializeCard();
        baseRequest = {
          currentScheduling: baseSchedulingData,
          reviewResult: {
            recallLevel: RecallLevel.MEDIUM,
            reviewedAt: new Date(),
          },
        };
      });

      it('should return a valid reschedule response', () => {
        const response = scheduler.reschedule(baseRequest);

        expect(response).toBeDefined();
        expect(response.newScheduling).toBeDefined();
        expect(calculateInterval(response.newScheduling)).toBeGreaterThan(0);
        expect(response.newScheduling.nextReviewDate).toBeInstanceOf(Date);
        expect(typeof response.wasSuccessful).toBe('boolean');
      });

      it('should increase interval for easy recall', () => {
        const easyRequest: RescheduleRequest = {
          ...baseRequest,
          reviewResult: {
            ...baseRequest.reviewResult,
            recallLevel: RecallLevel.EASY,
          },
        };

        const response = scheduler.reschedule(easyRequest);

        // The interval should either increase or stay the same for easy recall
        // Some algorithms (like SM2) have special rules for new cards
        expect(
          calculateInterval(response.newScheduling),
        ).toBeGreaterThanOrEqual(
          calculateInterval(baseRequest.currentScheduling),
        );
        expect(response.wasSuccessful).toBe(true);

        // For most algorithms, easy recall should eventually lead to increasing intervals
        // Test this by doing multiple easy reviews
        let currentScheduling = response.newScheduling;
        let hasIncreased = false;

        for (let i = 0; i < 3; i++) {
          const nextRequest: RescheduleRequest = {
            currentScheduling,
            reviewResult: {
              recallLevel: RecallLevel.EASY,
              reviewedAt: new Date(),
            },
          };

          const nextResponse = scheduler.reschedule(nextRequest);

          if (
            calculateInterval(nextResponse.newScheduling) >
            calculateInterval(currentScheduling)
          ) {
            hasIncreased = true;
            break;
          }

          currentScheduling = nextResponse.newScheduling;
        }

        // After multiple easy reviews, the interval should have increased at some point
        expect(hasIncreased).toBe(true);
      });

      it('should handle medium recall appropriately', () => {
        const mediumRequest: RescheduleRequest = {
          ...baseRequest,
          reviewResult: {
            ...baseRequest.reviewResult,
            recallLevel: RecallLevel.MEDIUM,
          },
        };

        const response = scheduler.reschedule(mediumRequest);

        expect(calculateInterval(response.newScheduling)).toBeGreaterThan(0);
        expect(response.wasSuccessful).toBe(true);
        // Medium might increase, maintain, or slightly decrease interval depending on algorithm
      });

      it('should decrease interval or reset for hard recall', () => {
        // First, let's create a card with some history
        let currentData = baseSchedulingData;

        // Simulate some successful reviews to build up interval
        for (let i = 0; i < 3; i++) {
          const easyReview: RescheduleRequest = {
            currentScheduling: currentData,
            reviewResult: {
              recallLevel: RecallLevel.EASY,
              reviewedAt: new Date(),
            },
          };
          const response = scheduler.reschedule(easyReview);
          currentData = response.newScheduling;
        }

        // Now test hard recall
        const hardRequest: RescheduleRequest = {
          currentScheduling: currentData,
          reviewResult: {
            recallLevel: RecallLevel.HARD,
            reviewedAt: new Date(),
          },
        };

        const response = scheduler.reschedule(hardRequest);

        expect(calculateInterval(response.newScheduling)).toBeLessThanOrEqual(
          calculateInterval(currentData),
        );
        expect(
          calculateIntervalChange(currentData, response.newScheduling),
        ).toBeLessThanOrEqual(0);
        expect(response.wasSuccessful).toBe(false);
      });

      it('should update lastReviewDate', () => {
        const reviewDate = new Date();
        const request: RescheduleRequest = {
          ...baseRequest,
          reviewResult: {
            ...baseRequest.reviewResult,
            reviewedAt: reviewDate,
          },
        };

        const response = scheduler.reschedule(request);

        expect(response.newScheduling.nextReviewDate).toBeDefined();
        expect(response.newScheduling.lastReviewDate).toBeDefined();
        expect(response.newScheduling.lastReviewDate?.getTime()).toBe(
          reviewDate.getTime(),
        );
      });

      it('should set nextReviewDate in the future', () => {
        const now = new Date();
        const response = scheduler.reschedule(baseRequest);

        expect(response.newScheduling.nextReviewDate.getTime()).toBeGreaterThan(
          now.getTime(),
        );
      });

      it('should preserve algorithm compatibility', () => {
        const response = scheduler.reschedule(baseRequest);
        const isCompatible = scheduler.isCompatibleSchedulingData(
          response.newScheduling,
        );

        expect(isCompatible).toBe(true);
      });
    });

    describe('isCompatibleSchedulingData', () => {
      it('should return true for data from initializeCard', () => {
        const data = scheduler.initializeCard();
        const isCompatible = scheduler.isCompatibleSchedulingData(data);

        expect(isCompatible).toBe(true);
      });

      it('should return false for incompatible algorithmData', () => {
        const data = scheduler.initializeCard();
        const incompatibleData: CardSchedulingData = {
          ...data,
          algorithmData: { invalidField: 'this should not be compatible' },
        };

        const isCompatible =
          scheduler.isCompatibleSchedulingData(incompatibleData);

        expect(isCompatible).toBe(false);
      });
    });

    describe('migrateFromAlgorithm', () => {
      it('should handle migration from same algorithm', () => {
        const originalData = scheduler.initializeCard();
        const migratedData = scheduler.migrateFromAlgorithm(
          originalData,
          algorithmType,
        );

        // Should either return the same data or a valid migrated version
        if (migratedData) {
          expect(scheduler.isCompatibleSchedulingData(migratedData)).toBe(true);
          expect(calculateInterval(migratedData)).toBeGreaterThanOrEqual(0);
          expect(migratedData.nextReviewDate).toBeInstanceOf(Date);
        }
      });

      it('should return valid data or null for different algorithms', () => {
        const originalData = scheduler.initializeCard();
        const otherAlgorithms = Object.values(AlgorithmType).filter(
          (alg) => alg !== algorithmType,
        );

        for (const otherAlgorithm of otherAlgorithms) {
          const migratedData = scheduler.migrateFromAlgorithm(
            originalData,
            otherAlgorithm,
          );

          if (migratedData !== null) {
            expect(scheduler.isCompatibleSchedulingData(migratedData)).toBe(
              true,
            );
            expect(calculateInterval(migratedData)).toBeGreaterThanOrEqual(0);
            expect(migratedData.nextReviewDate).toBeInstanceOf(Date);
          }
        }
      });
    });

    describe('consistency tests', () => {
      it('should produce consistent results for same input', () => {
        const data = scheduler.initializeCard();
        const request: RescheduleRequest = {
          currentScheduling: data,
          reviewResult: {
            recallLevel: RecallLevel.MEDIUM,
            reviewedAt: new Date('2023-01-01T10:00:00Z'),
          },
        };

        const response1 = scheduler.reschedule(request);
        const response2 = scheduler.reschedule(request);

        expect(calculateInterval(response1.newScheduling)).toBe(
          calculateInterval(response2.newScheduling),
        );
        expect(response1.newScheduling.nextReviewDate.getTime()).toBe(
          response2.newScheduling.nextReviewDate.getTime(),
        );
        expect(response1.wasSuccessful).toBe(response2.wasSuccessful);

        // Calculate interval changes manually for comparison
        const intervalChange1 = calculateIntervalChange(
          data,
          response1.newScheduling,
        );
        const intervalChange2 = calculateIntervalChange(
          data,
          response2.newScheduling,
        );
        expect(intervalChange1).toBe(intervalChange2);
      });
    });
  });
}

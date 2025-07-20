import { AlgorithmType } from '../../core/spaced-repetition-scheduler.interface';
import { testSpacedRepetitionScheduler } from '../../core/spaced-repetition-scheduler.generic.test';
import { SM2Scheduler } from './sm2-scheduler';

describe('SM2Scheduler', () => {
  // Use the generic test suite
  testSpacedRepetitionScheduler(() => new SM2Scheduler(), AlgorithmType.SM2);

  // Additional SM2-specific tests
  describe('SM2-specific behavior', () => {
    let scheduler: SM2Scheduler;

    beforeEach(() => {
      scheduler = new SM2Scheduler();
    });

    describe('initializeCard', () => {
      it('should create card with SM2 default values', () => {
        const card = scheduler.initializeCard();

        expect(card.algorithmData.efactor).toBe(2.5);
        expect(card.algorithmData.repetition).toBe(0);
      });
    });

    describe('isCompatibleSchedulingData', () => {
      it('should validate SM2 algorithm data correctly', () => {
        const validData = scheduler.initializeCard();
        expect(scheduler.isCompatibleSchedulingData(validData)).toBe(true);
      });

      it('should reject invalid efactor', () => {
        const invalidData = {
          ...scheduler.initializeCard(),
          algorithmData: { efactor: 1.0, repetition: 0 }, // efactor too low
        };
        expect(scheduler.isCompatibleSchedulingData(invalidData)).toBe(false);
      });

      it('should reject invalid repetition', () => {
        const invalidData = {
          ...scheduler.initializeCard(),
          algorithmData: { efactor: 2.5, repetition: -1 }, // negative repetition
        };
        expect(scheduler.isCompatibleSchedulingData(invalidData)).toBe(false);
      });

      it('should reject non-integer repetition', () => {
        const invalidData = {
          ...scheduler.initializeCard(),
          algorithmData: { efactor: 2.5, repetition: 1.5 }, // non-integer
        };
        expect(scheduler.isCompatibleSchedulingData(invalidData)).toBe(false);
      });
    });

    describe('migrateFromAlgorithm', () => {
      it('should return same data for SM2 to SM2 migration', () => {
        const originalData = scheduler.initializeCard();
        const migrated = scheduler.migrateFromAlgorithm(
          originalData,
          AlgorithmType.SM2,
        );

        expect(migrated).toEqual(originalData);
      });

      it('should create reasonable defaults for other algorithms', () => {
        // TODO
      });
    });
  });
});

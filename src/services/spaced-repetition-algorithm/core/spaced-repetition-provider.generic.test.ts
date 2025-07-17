import {
  AlgorithmType,
  RecallLevel,
  SpacedRepetitionAlgorithmProvider,
  ISpacedRepetitionScheduler,
} from './spaced-repetition-algorithm.interface';
import { calculateInterval } from '../providers/scheduling-utils';

/**
 * Generic test suite for SpacedRepetitionAlgorithmProvider implementations
 * This function tests any implementation of the SpacedRepetitionAlgorithmProvider interface
 */
export function testSpacedRepetitionAlgorithmProvider(
  createProvider: () => SpacedRepetitionAlgorithmProvider,
  availableAlgorithms: AlgorithmType[],
): void {
  describe('SpacedRepetitionAlgorithmProvider', () => {
    let provider: SpacedRepetitionAlgorithmProvider;

    beforeEach(() => {
      provider = createProvider();
    });

    describe('getSupportedAlgorithms', () => {
      it('should return array of supported algorithms', () => {
        const supported = provider.getSupportedAlgorithms();

        expect(Array.isArray(supported)).toBe(true);
        expect(supported.length).toBeGreaterThan(0);

        // Should contain only valid algorithm types
        for (const algorithm of supported) {
          expect(Object.values(AlgorithmType)).toContain(algorithm);
        }
      });

      it('should return algorithms that match expected availability', () => {
        const supported = provider.getSupportedAlgorithms();

        for (const expectedAlgorithm of availableAlgorithms) {
          expect(supported).toContain(expectedAlgorithm);
        }
      });

      it('should not return duplicate algorithms', () => {
        const supported = provider.getSupportedAlgorithms();
        const uniqueSupported = [...new Set(supported)];

        expect(supported.length).toBe(uniqueSupported.length);
      });
    });

    describe('isAlgorithmSupported', () => {
      it('should return true for supported algorithms', () => {
        const supported = provider.getSupportedAlgorithms();

        for (const algorithm of supported) {
          expect(provider.isAlgorithmSupported(algorithm)).toBe(true);
        }
      });

      it('should be consistent with getSupportedAlgorithms', () => {
        const supported = provider.getSupportedAlgorithms();

        for (const algorithmType of Object.values(AlgorithmType)) {
          const isSupported = provider.isAlgorithmSupported(algorithmType);
          const isInSupportedList = supported.includes(algorithmType);

          expect(isSupported).toBe(isInSupportedList);
        }
      });
    });

    describe('getScheduler', () => {
      it('should return scheduler for supported algorithms', () => {
        const supported = provider.getSupportedAlgorithms();

        for (const algorithm of supported) {
          const scheduler = provider.getScheduler(algorithm);

          expect(scheduler).toBeDefined();
          expect(scheduler.algorithmType).toBe(algorithm);
        }
      });

      it('should throw error for unsupported algorithms', () => {
        const supported = provider.getSupportedAlgorithms();
        const unsupported = Object.values(AlgorithmType).filter(
          (alg) => !supported.includes(alg),
        );

        for (const algorithm of unsupported) {
          expect(() => provider.getScheduler(algorithm)).toThrow();
        }
      });

      it('should return same instance for multiple calls (or equivalent instances)', () => {
        const supported = provider.getSupportedAlgorithms();

        for (const algorithm of supported) {
          const scheduler1 = provider.getScheduler(algorithm);
          const scheduler2 = provider.getScheduler(algorithm);

          // Should be same instance or equivalent
          expect(scheduler1.algorithmType).toBe(scheduler2.algorithmType);

          // Test that they behave consistently
          const initialData1 = scheduler1.initializeCard();
          const initialData2 = scheduler2.initializeCard();

          expect(calculateInterval(initialData1)).toBe(
            calculateInterval(initialData2),
          );
        }
      });

      it('should return schedulers that work correctly', () => {
        const supported = provider.getSupportedAlgorithms();

        for (const algorithm of supported) {
          const scheduler = provider.getScheduler(algorithm);

          // Basic functionality test
          const initialData = scheduler.initializeCard();
          expect(initialData).toBeDefined();
          expect(calculateInterval(initialData)).toBeGreaterThan(0);
          expect(scheduler.isCompatibleSchedulingData(initialData)).toBe(true);
        }
      });
    });

    describe('registerScheduler', () => {
      it('should allow registering new schedulers', () => {
        // Create a mock scheduler for testing
        const mockScheduler: ISpacedRepetitionScheduler = {
          algorithmType: AlgorithmType.SM2, // Use an existing type for testing
          reschedule: jest.fn().mockReturnValue({
            newScheduling: {
              interval: 1,
              nextReviewDate: new Date(),
              algorithmData: {},
            },
            wasSuccessful: true,
            intervalChange: 0,
          }),
          initializeCard: jest.fn().mockReturnValue({
            interval: 1,
            nextReviewDate: new Date(),
            algorithmData: {},
          }),
          isCompatibleSchedulingData: jest.fn().mockReturnValue(true),
          migrateFromAlgorithm: jest.fn().mockReturnValue(null),
        };

        // Should not throw
        expect(() => provider.registerScheduler(mockScheduler)).not.toThrow();
      });

      it('should make registered scheduler available via getScheduler', () => {
        // Find an algorithm type that's not currently supported (if any)
        const allAlgorithms = Object.values(AlgorithmType);
        const supported = provider.getSupportedAlgorithms();
        const unsupportedAlgorithm = allAlgorithms.find(
          (alg) => !supported.includes(alg),
        );

        if (unsupportedAlgorithm) {
          const mockScheduler: ISpacedRepetitionScheduler = {
            algorithmType: unsupportedAlgorithm,
            reschedule: jest.fn().mockReturnValue({
              newScheduling: {
                interval: 1,
                nextReviewDate: new Date(),
                algorithmData: {},
              },
              wasSuccessful: true,
              intervalChange: 0,
            }),
            initializeCard: jest.fn().mockReturnValue({
              interval: 1,
              nextReviewDate: new Date(),
              algorithmData: {},
            }),
            isCompatibleSchedulingData: jest.fn().mockReturnValue(true),
            migrateFromAlgorithm: jest.fn().mockReturnValue(null),
          };

          provider.registerScheduler(mockScheduler);

          // Should now be supported
          expect(provider.isAlgorithmSupported(unsupportedAlgorithm)).toBe(
            true,
          );
          expect(provider.getSupportedAlgorithms()).toContain(
            unsupportedAlgorithm,
          );

          // Should be able to get the scheduler
          const retrievedScheduler =
            provider.getScheduler(unsupportedAlgorithm);
          expect(retrievedScheduler.algorithmType).toBe(unsupportedAlgorithm);
        }
      });

      it('should handle re-registration of existing algorithm', () => {
        const supported = provider.getSupportedAlgorithms();

        if (supported.length > 0) {
          const existingAlgorithm = supported[0];

          const newMockScheduler: ISpacedRepetitionScheduler = {
            algorithmType: existingAlgorithm,
            reschedule: jest.fn().mockReturnValue({
              newScheduling: {
                interval: 999, // Different behavior
                nextReviewDate: new Date(),
                algorithmData: {},
              },
              wasSuccessful: true,
              intervalChange: 0,
            }),
            initializeCard: jest.fn().mockReturnValue({
              interval: 999, // Different behavior
              nextReviewDate: new Date(),
              algorithmData: {},
            }),
            isCompatibleSchedulingData: jest.fn().mockReturnValue(true),
            migrateFromAlgorithm: jest.fn().mockReturnValue(null),
          };

          // Should not throw when re-registering
          expect(() =>
            provider.registerScheduler(newMockScheduler),
          ).not.toThrow();
        }
      });
    });

    describe('integration tests', () => {
      it('should work with all supported algorithms end-to-end', () => {
        const supported = provider.getSupportedAlgorithms();

        for (const algorithm of supported) {
          const scheduler = provider.getScheduler(algorithm);

          // Initialize a card
          const initialData = scheduler.initializeCard();

          // Perform a review
          const reviewResult = {
            recallLevel: RecallLevel.MEDIUM,
            responseTime: 5.0,
            reviewedAt: new Date(),
          };

          const rescheduleResponse = scheduler.reschedule({
            currentScheduling: initialData,
            reviewResult,
          });

          // Verify the response is valid
          expect(rescheduleResponse.newScheduling).toBeDefined();
          expect(
            calculateInterval(rescheduleResponse.newScheduling),
          ).toBeGreaterThan(0);
          expect(
            scheduler.isCompatibleSchedulingData(
              rescheduleResponse.newScheduling,
            ),
          ).toBe(true);
        }
      });
    });
  });
}

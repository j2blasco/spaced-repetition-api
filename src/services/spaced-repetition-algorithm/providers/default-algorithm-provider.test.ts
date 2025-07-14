import { AlgorithmType } from '../spaced-repetition-algorithm.interface';
import { testSpacedRepetitionAlgorithmProvider } from '../spaced-repetition-provider.generic.test';
import { DefaultSpacedRepetitionAlgorithmProvider } from './default-algorithm-provider';

describe('DefaultSpacedRepetitionAlgorithmProvider', () => {
  // Use the generic test suite
  testSpacedRepetitionAlgorithmProvider(
    () => new DefaultSpacedRepetitionAlgorithmProvider(),
    [AlgorithmType.SM2], // Available algorithms
  );

  // Additional provider-specific tests
  describe('DefaultSpacedRepetitionAlgorithmProvider-specific behavior', () => {
    let provider: DefaultSpacedRepetitionAlgorithmProvider;

    beforeEach(() => {
      provider = new DefaultSpacedRepetitionAlgorithmProvider();
    });

    describe('constructor', () => {
      it('should register SM2 scheduler by default', () => {
        expect(provider.getSupportedAlgorithms()).toContain(AlgorithmType.SM2);
        expect(provider.isAlgorithmSupported(AlgorithmType.SM2)).toBe(true);
      });

      it('should not support other algorithms by default', () => {
        expect(provider.isAlgorithmSupported(AlgorithmType.SM4)).toBe(false);
        expect(provider.isAlgorithmSupported(AlgorithmType.FSRS)).toBe(false);
      });
    });

    describe('getScheduler', () => {
      it('should return SM2 scheduler', () => {
        const scheduler = provider.getScheduler(AlgorithmType.SM2);
        expect(scheduler.algorithmType).toBe(AlgorithmType.SM2);
      });

      it('should throw error for unsupported algorithms', () => {
        expect(() => provider.getScheduler(AlgorithmType.SM4)).toThrow(
          "Algorithm 'sm4' is not supported",
        );
      });
    });

    describe('registerScheduler', () => {
      it('should allow registering additional schedulers', () => {
        // Create a mock scheduler for testing
        const mockScheduler = {
          algorithmType: AlgorithmType.SM4,
          reschedule: jest.fn(),
          initializeCard: jest.fn(),
          isCompatibleSchedulingData: jest.fn(),
          migrateFromAlgorithm: jest.fn(),
        };

        provider.registerScheduler(mockScheduler);

        expect(provider.isAlgorithmSupported(AlgorithmType.SM4)).toBe(true);
        expect(provider.getSupportedAlgorithms()).toContain(AlgorithmType.SM4);
        expect(provider.getScheduler(AlgorithmType.SM4)).toBe(mockScheduler);
      });

      it('should allow overriding existing schedulers', () => {
        // Create a new SM2 scheduler
        const newSM2Scheduler = {
          algorithmType: AlgorithmType.SM2,
          reschedule: jest.fn(),
          initializeCard: jest.fn(),
          isCompatibleSchedulingData: jest.fn(),
          migrateFromAlgorithm: jest.fn(),
        };

        const originalScheduler = provider.getScheduler(AlgorithmType.SM2);
        provider.registerScheduler(newSM2Scheduler);
        const newScheduler = provider.getScheduler(AlgorithmType.SM2);

        expect(newScheduler).toBe(newSM2Scheduler);
        expect(newScheduler).not.toBe(originalScheduler);
      });
    });

    describe('getSupportedAlgorithms', () => {
      it('should return array with SM2 by default', () => {
        const supported = provider.getSupportedAlgorithms();
        expect(supported).toEqual([AlgorithmType.SM2]);
      });

      it('should include newly registered algorithms', () => {
        const mockScheduler = {
          algorithmType: AlgorithmType.FSRS,
          reschedule: jest.fn(),
          initializeCard: jest.fn(),
          isCompatibleSchedulingData: jest.fn(),
          migrateFromAlgorithm: jest.fn(),
        };

        provider.registerScheduler(mockScheduler);
        const supported = provider.getSupportedAlgorithms();

        expect(supported).toContain(AlgorithmType.SM2);
        expect(supported).toContain(AlgorithmType.FSRS);
        expect(supported.length).toBe(2);
      });
    });
  });
});

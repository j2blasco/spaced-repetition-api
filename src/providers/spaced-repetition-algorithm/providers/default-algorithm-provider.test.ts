import { describe, beforeEach, it, expect } from 'vitest';
import { AlgorithmType } from '../core/spaced-repetition-scheduler.interface';
import { testSpacedRepetitionAlgorithmProvider } from '../core/spaced-repetition.generic.test';
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
        // TODO;
      });

      it('should allow overriding existing schedulers', () => {
        // TODO:
      });
    });

    describe('getSupportedAlgorithms', () => {
      it('should return array with SM2 by default', () => {
        const supported = provider.getSupportedAlgorithms();
        expect(supported).toEqual([AlgorithmType.SM2]);
      });

      it('should include newly registered algorithms', () => {
        // TODO:
      });
    });
  });
});

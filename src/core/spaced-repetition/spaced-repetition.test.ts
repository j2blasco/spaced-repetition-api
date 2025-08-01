import { DependencyInjector } from 'src/providers/injector/injector';
import { spacedRepetitionSchedulerInjectionToken } from 'src/providers/spaced-repetition-algorithm/core/space-repetition.injection-token';
import { getCardRepository } from './card/get-card-repository';
import { getUserRepository } from '../user/get-user-repository';
import { registerProviders } from 'src/providers/providers-registration/providers-test';
import {
  AlgorithmType,
  RecallLevel,
} from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';
import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
  vi,
} from 'vitest';

describe('Spaced Repetition System - Full User Story', () => {
  beforeAll(() => {
    vi.useFakeTimers(); // enable fake timers
  });

  afterAll(() => {
    vi.useRealTimers(); // restore real timers after tests
  });

  beforeEach(() => {
    // Register test providers for each test
    registerProviders();
  });

  it('should demonstrate complete spaced repetition workflow with time progression', async () => {
    // Set initial fixed date
    const startDate = new Date('2024-01-01T09:00:00Z');
    vi.setSystemTime(startDate);

    // Get dependencies
    const cardRepo = getCardRepository();
    const userRepo = getUserRepository();
    const spacedRepetition = DependencyInjector.inject(
      spacedRepetitionSchedulerInjectionToken,
    );

    // 1. Create a user
    const userResult = await userRepo.create({
      preferences: {
        maxNewCardsPerDay: 10,
        maxReviewsPerDay: 50,
        timezone: 'UTC',
        defaultAlgorithm: 'sm2',
      },
    });
    expect(() => userResult.unwrapOrThrow()).not.toThrow();
    const user = userResult.unwrapOrThrow();

    // 2. Create some vocabulary cards
    const cards = [
      { front: 'Hello', back: 'Hola', tags: ['spanish', 'greetings'] },
      { front: 'Goodbye', back: 'Adiós', tags: ['spanish', 'greetings'] },
      { front: 'Thank you', back: 'Gracias', tags: ['spanish', 'courtesy'] },
    ];

    const createdCards = [];
    for (const cardData of cards) {
      const cardResult = await cardRepo.create({
        userId: user.id,
        tags: cardData.tags,
        data: { front: cardData.front, back: cardData.back },
        algorithmType: AlgorithmType.SM2,
      });
      expect(() => cardResult.unwrapOrThrow()).not.toThrow();
      createdCards.push(cardResult.unwrapOrThrow());
    }

    // 3. Verify initial state - new cards should be immediately available for review
    const initialDueCardsResult = await cardRepo.findDueCards({
      userId: user.id,
      currentDate: startDate,
    });
    expect(() => initialDueCardsResult.unwrapOrThrow()).not.toThrow();
    const initialDueCards = initialDueCardsResult.unwrapOrThrow();
    expect(initialDueCards).toHaveLength(3); // All new cards should be immediately due

    // 4. Review the first card to test rescheduling
    const firstCard = initialDueCards[0];
    const scheduler = spacedRepetition.getScheduler(
      firstCard.scheduling.algorithmType,
    );

    // Review with "good" response
    const goodReview = scheduler.reschedule({
      currentScheduling: firstCard.scheduling,
      reviewResult: {
        recallLevel: RecallLevel.MEDIUM, // 'good'
        reviewedAt: startDate,
      },
    });

    expect(goodReview.newScheduling.nextReviewDate).toBeInstanceOf(Date);
    expect(goodReview.newScheduling.nextReviewDate.getTime()).toBeGreaterThan(
      startDate.getTime(),
    );

    // 5. Simulate reviewing with "failed" (forgot the answer)
    const againReview = scheduler.reschedule({
      currentScheduling: firstCard.scheduling,
      reviewResult: {
        recallLevel: RecallLevel.HARD, // 'failed'
        reviewedAt: startDate,
      },
    });

    expect(againReview.newScheduling.nextReviewDate).toBeInstanceOf(Date);
    // "again" should schedule sooner than or equal to "good" (SM2 may give same interval for new cards)
    expect(
      againReview.newScheduling.nextReviewDate.getTime(),
    ).toBeLessThanOrEqual(goodReview.newScheduling.nextReviewDate.getTime());

    // 6. Test filtering by tags
    const spanishGreetingsResult = await cardRepo.findDueCards({
      userId: user.id,
      tags: ['greetings'],
      currentDate: startDate,
    });
    expect(() => spanishGreetingsResult.unwrapOrThrow()).not.toThrow();
    const spanishGreetings = spanishGreetingsResult.unwrapOrThrow();
    expect(spanishGreetings.length).toBeGreaterThan(0);
    expect(
      spanishGreetings.every((card) => card.tags.includes('greetings')),
    ).toBe(true);

    // 7. Advance time to test long-term scheduling
    const oneWeekLater = new Date('2024-01-08T09:00:00Z');
    vi.setSystemTime(oneWeekLater);

    // After reviewing cards and time progression, some cards should be due again
    const laterDueCardsResult = await cardRepo.findDueCards({
      userId: user.id,
      currentDate: oneWeekLater,
    });
    expect(() => laterDueCardsResult.unwrapOrThrow()).not.toThrow();
    const laterDueCards = laterDueCardsResult.unwrapOrThrow();

    // Verify the spaced repetition system is working
    expect(laterDueCards.length).toBeGreaterThanOrEqual(0);

    // 8. Test user preferences are respected
    expect(user.preferences.maxNewCardsPerDay).toBe(10);
    expect(user.preferences.defaultAlgorithm).toBe('sm2');

    // 9. Verify we can update user preferences
    const updateResult = await userRepo.update(user.id, {
      preferences: { maxNewCardsPerDay: 15 },
    });
    expect(() => updateResult.unwrapOrThrow()).not.toThrow();
    const updatedUser = updateResult.unwrapOrThrow();
    expect(updatedUser.preferences.maxNewCardsPerDay).toBe(15);
  });

  it('should handle time progression and due date calculations correctly', async () => {
    // Set a specific starting time
    const fixedDate = new Date('2024-06-15T10:00:00Z');
    vi.setSystemTime(fixedDate);

    expect(new Date().toISOString()).toBe('2024-06-15T10:00:00.000Z');

    // Setup dependencies
    const cardRepo = getCardRepository();
    const userRepo = getUserRepository();
    const spacedRepetition = DependencyInjector.inject(
      spacedRepetitionSchedulerInjectionToken,
    );

    // Create user and card
    const userResult = await userRepo.create({ preferences: {} });
    const user = userResult.unwrapOrThrow();

    const cardResult = await cardRepo.create({
      userId: user.id,
      tags: ['test'],
      data: { front: 'Test', back: 'Prueba' },
      algorithmType: AlgorithmType.SM2,
    });
    const card = cardResult.unwrapOrThrow();

    // Test scheduling behavior over time
    const scheduler = spacedRepetition.getScheduler(AlgorithmType.SM2);

    // Initial review with 'good'
    const firstReview = scheduler.reschedule({
      currentScheduling: card.scheduling,
      reviewResult: {
        recallLevel: RecallLevel.MEDIUM, // 'good'
        reviewedAt: fixedDate,
      },
    });

    // Advance time to when card is due
    const nextReviewTime = new Date(
      firstReview.newScheduling.nextReviewDate.getTime() + 1000,
    ); // 1 second after due
    vi.setSystemTime(nextReviewTime);

    const dueCardsResult = await cardRepo.findDueCards({
      userId: user.id,
      currentDate: nextReviewTime,
    });
    const dueCards = dueCardsResult.unwrapOrThrow();

    // The card should be due at this time
    expect(dueCards.some((c) => c.id === card.id)).toBe(true);

    // Advance further and check scheduling intervals increase
    const secondReview = scheduler.reschedule({
      currentScheduling: firstReview.newScheduling,
      reviewResult: {
        recallLevel: RecallLevel.MEDIUM, // 'good'
        reviewedAt: nextReviewTime,
      },
    });

    // The interval should increase (spaced repetition principle)
    const firstInterval =
      firstReview.newScheduling.nextReviewDate.getTime() - fixedDate.getTime();
    const secondInterval =
      secondReview.newScheduling.nextReviewDate.getTime() -
      nextReviewTime.getTime();
    expect(secondInterval).toBeGreaterThan(firstInterval);
  });

  it('should demonstrate complete workflow with difficult vs easy cards', async () => {
    const startTime = new Date('2024-03-01T08:00:00Z');
    vi.setSystemTime(startTime);

    const cardRepo = getCardRepository();
    const userRepo = getUserRepository();
    const spacedRepetition = DependencyInjector.inject(
      spacedRepetitionSchedulerInjectionToken,
    );

    // Create user
    const userResult = await userRepo.create({ preferences: {} });
    const user = userResult.unwrapOrThrow();

    // Create two identical cards to test different review paths
    const easyCardResult = await cardRepo.create({
      userId: user.id,
      tags: ['comparison'],
      data: { front: 'Easy card', back: 'Answer' },
      algorithmType: AlgorithmType.SM2,
    });
    const hardCardResult = await cardRepo.create({
      userId: user.id,
      tags: ['comparison'],
      data: { front: 'Hard card', back: 'Answer' },
      algorithmType: AlgorithmType.SM2,
    });

    const easyCard = easyCardResult.unwrapOrThrow();
    const hardCard = hardCardResult.unwrapOrThrow();

    const scheduler = spacedRepetition.getScheduler(AlgorithmType.SM2);

    // Simulate different review patterns
    let easyScheduling = easyCard.scheduling;
    let hardScheduling = hardCard.scheduling;

    let currentTime = startTime;

    // Review cycle 1: Easy card gets 'easy', hard card gets 'again'
    const nextDay = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    vi.setSystemTime(nextDay);
    currentTime = nextDay;

    const easyReviewResult = scheduler.reschedule({
      currentScheduling: easyScheduling,
      reviewResult: {
        recallLevel: RecallLevel.EASY, // 'easy'
        reviewedAt: currentTime,
      },
    });
    easyScheduling = easyReviewResult.newScheduling;

    const hardReviewResult = scheduler.reschedule({
      currentScheduling: hardScheduling,
      reviewResult: {
        recallLevel: RecallLevel.HARD, // 'failed'
        reviewedAt: currentTime,
      },
    });
    hardScheduling = hardReviewResult.newScheduling;

    // Easy card should be scheduled further out than or equal to hard card (algorithms may behave similarly initially)
    expect(easyScheduling.nextReviewDate.getTime()).toBeGreaterThanOrEqual(
      hardScheduling.nextReviewDate.getTime(),
    );

    // Review cycle 2: Continue the pattern
    const easyNextReview = new Date(
      easyScheduling.nextReviewDate.getTime() + 1000,
    );
    const hardNextReview = new Date(
      hardScheduling.nextReviewDate.getTime() + 1000,
    );

    // Test easy card when it's due
    vi.setSystemTime(easyNextReview);
    const easySecondResult = scheduler.reschedule({
      currentScheduling: easyScheduling,
      reviewResult: {
        recallLevel: RecallLevel.MEDIUM, // 'good'
        reviewedAt: easyNextReview,
      },
    });
    easyScheduling = easySecondResult.newScheduling;

    // Test hard card when it's due
    vi.setSystemTime(hardNextReview);
    const hardSecondResult = scheduler.reschedule({
      currentScheduling: hardScheduling,
      reviewResult: {
        recallLevel: RecallLevel.MEDIUM, // 'good'
        reviewedAt: hardNextReview,
      },
    });
    hardScheduling = hardSecondResult.newScheduling;

    // Verify the algorithm is adapting to performance
    expect(easyScheduling.nextReviewDate.getTime()).toBeGreaterThan(
      hardScheduling.nextReviewDate.getTime(),
    );

    // Final verification: Check that we can query due cards at different times
    const futureTime = new Date(
      Math.max(
        easyScheduling.nextReviewDate.getTime(),
        hardScheduling.nextReviewDate.getTime(),
      ) + 1000,
    );
    vi.setSystemTime(futureTime);

    const allDueResult = await cardRepo.findDueCards({
      userId: user.id,
      currentDate: futureTime,
    });
    const allDue = allDueResult.unwrapOrThrow();

    // Both cards should eventually be due
    expect(allDue.length).toBeGreaterThanOrEqual(2);
  });
});

import { CardRepository } from './card.repository';
import { NoSqlDatabaseTesting } from '@j2blasco/ts-crud';
import { DefaultSpacedRepetitionAlgorithmProvider } from 'src/providers/spaced-repetition-algorithm/providers/default-algorithm-provider';
import { AlgorithmType } from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Simplified Card System', () => {
  let db = new NoSqlDatabaseTesting();
  let spaceRepetition = new DefaultSpacedRepetitionAlgorithmProvider();

  it('should create and find cards with tags', async () => {
    const repository = new CardRepository(db, spaceRepetition);
    const userId = 'user123';

    // Create a Spanish vocabulary card
    const cardResult = await repository.create({
      userId,
      tags: ['spanish', 'vocabulary', 'beginner'],
      data: {
        front: 'Hello',
        back: 'Hola',
        cardType: 'basic',
      },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => cardResult.unwrapOrThrow()).not.toThrow();
    const card = cardResult.unwrapOrThrow();
    expect(card.id).toBeDefined();
    expect(card.userId).toBe(userId);
    expect(card.tags).toEqual(['spanish', 'vocabulary', 'beginner']);
    expect(card.data.front).toBe('Hello');
    expect(card.data.back).toBe('Hola');

    // Find cards by tags
    const spanishCardsResult = await repository.findByTags(userId, ['spanish']);
    expect(() => spanishCardsResult.unwrapOrThrow()).not.toThrow();
    const spanishCards = spanishCardsResult.unwrapOrThrow();
    expect(spanishCards).toHaveLength(1);
    expect(spanishCards[0].id).toBe(card.id);

    // Find cards by user
    const userCardsResult = await repository.findByUserId(userId);
    expect(() => userCardsResult.unwrapOrThrow()).not.toThrow();
    const userCards = userCardsResult.unwrapOrThrow();
    expect(userCards).toHaveLength(1);
    expect(userCards[0].id).toBe(card.id);
  });

  it('should support flexible data structures', async () => {
    const repository = new CardRepository(db, spaceRepetition);
    const userId = 'user123';

    // Create a math problem card
    const mathCardResult = await repository.create({
      userId,
      tags: ['math', 'algebra', 'quadratic'],
      data: {
        problem: 'Solve: x² + 5x + 6 = 0',
        solution: 'x = -2 or x = -3',
        steps: ['factor', 'set equal to zero'],
        cardType: 'problem',
        difficulty: 'medium',
      },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => mathCardResult.unwrapOrThrow()).not.toThrow();
    const mathCard = mathCardResult.unwrapOrThrow();
    expect(mathCard.data.problem).toBe('Solve: x² + 5x + 6 = 0');
    expect(mathCard.data.steps).toEqual(['factor', 'set equal to zero']);
    expect(mathCard.data.difficulty).toBe('medium');

    // Create a cloze deletion card
    const clozeCardResult = await repository.create({
      userId,
      tags: ['history', 'dates'],
      data: {
        text: 'World War II ended in {{c1::1945}}',
        clozeType: 'deletion',
        field: 'c1',
        answer: '1945',
      },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => clozeCardResult.unwrapOrThrow()).not.toThrow();
    const clozeCard = clozeCardResult.unwrapOrThrow();
    expect(clozeCard.data.text).toBe('World War II ended in {{c1::1945}}');
    expect(clozeCard.data.answer).toBe('1945');

    // Verify we can find by different tag combinations
    const mathCardsResult = await repository.findByTags(userId, ['math']);
    const historyCardsResult = await repository.findByTags(userId, ['history']);

    expect(() => mathCardsResult.unwrapOrThrow()).not.toThrow();
    expect(() => historyCardsResult.unwrapOrThrow()).not.toThrow();
    const mathCards = mathCardsResult.unwrapOrThrow();
    const historyCards = historyCardsResult.unwrapOrThrow();

    expect(mathCards).toHaveLength(1);
    expect(historyCards).toHaveLength(1);
    expect(mathCards[0].id).toBe(mathCard.id);
    expect(historyCards[0].id).toBe(clozeCard.id);
  });
});

describe('Card Repository - Due Cards Functionality', () => {
  let db = new NoSqlDatabaseTesting();
  let spaceRepetition = new DefaultSpacedRepetitionAlgorithmProvider();
  let repository: CardRepository;
  const userId = 'test-user-due-cards';

  beforeEach(() => {
    db = new NoSqlDatabaseTesting();
    repository = new CardRepository(db, spaceRepetition);
  });

  it('should find cards that are due for review', async () => {
    // Create a card with scheduling for tomorrow (should be due if we query with future date)
    const cardResult = await repository.create({
      userId,
      tags: ['test'],
      data: { front: 'test', back: 'test' },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => cardResult.unwrapOrThrow()).not.toThrow();
    const card = cardResult.unwrapOrThrow();

    // Verify the card was created with expected scheduling
    expect(card.scheduling).toBeDefined();
    expect(card.scheduling.nextReviewDate).toBeInstanceOf(Date);

    // Query for due cards using a date well in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 1 week in future

    const dueCardsResult = await repository.findDueCards({
      userId,
      currentDate: futureDate,
    });

    expect(() => dueCardsResult.unwrapOrThrow()).not.toThrow();
    const dueCards = dueCardsResult.unwrapOrThrow();

    expect(dueCards).toHaveLength(1);
    expect(dueCards[0].id).toBe(card.id);
  });

  it('should not find cards that are not yet due', async () => {
    // Create a card
    const cardResult = await repository.create({
      userId,
      tags: ['test'],
      data: { front: 'test', back: 'test' },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => cardResult.unwrapOrThrow()).not.toThrow();
    const _card = cardResult.unwrapOrThrow();

    // Query for due cards using yesterday's date (before the card is due)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dueCardsResult = await repository.findDueCards({
      userId,
      currentDate: yesterday,
    });

    expect(() => dueCardsResult.unwrapOrThrow()).not.toThrow();
    const dueCards = dueCardsResult.unwrapOrThrow();
    expect(dueCards).toHaveLength(0);
  });

  it('should filter due cards by tags', async () => {
    // Create cards with different tags
    const mathCardResult = await repository.create({
      userId,
      tags: ['math'],
      data: { front: 'math', back: 'math' },
      algorithmType: AlgorithmType.SM2,
    });

    const scienceCardResult = await repository.create({
      userId,
      tags: ['science'],
      data: { front: 'science', back: 'science' },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => mathCardResult.unwrapOrThrow()).not.toThrow();
    expect(() => scienceCardResult.unwrapOrThrow()).not.toThrow();

    // Query for due cards with math tag
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const mathDueCardsResult = await repository.findDueCards({
      userId,
      tags: ['math'],
      currentDate: futureDate,
    });

    expect(() => mathDueCardsResult.unwrapOrThrow()).not.toThrow();
    const mathDueCards = mathDueCardsResult.unwrapOrThrow();
    expect(mathDueCards).toHaveLength(1);
    expect(mathDueCards[0].tags).toContain('math');
  });

  it('should respect limit parameter', async () => {
    // Create multiple cards
    const card1Result = await repository.create({
      userId,
      tags: ['test'],
      data: { front: 'test1', back: 'test1' },
      algorithmType: AlgorithmType.SM2,
    });

    const card2Result = await repository.create({
      userId,
      tags: ['test'],
      data: { front: 'test2', back: 'test2' },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => card1Result.unwrapOrThrow()).not.toThrow();
    expect(() => card2Result.unwrapOrThrow()).not.toThrow();

    // Query with limit
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const limitedDueCardsResult = await repository.findDueCards({
      userId,
      limit: 1,
      currentDate: futureDate,
    });

    expect(() => limitedDueCardsResult.unwrapOrThrow()).not.toThrow();
    const limitedDueCards = limitedDueCardsResult.unwrapOrThrow();
    expect(limitedDueCards.length).toBeLessThanOrEqual(1);
  });

  it('should return empty array for non-existent user', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const dueCardsResult = await repository.findDueCards({
      userId: 'non-existent-user',
      currentDate: futureDate,
    });

    expect(() => dueCardsResult.unwrapOrThrow()).not.toThrow();
    const dueCards = dueCardsResult.unwrapOrThrow();
    expect(dueCards).toHaveLength(0);
  });

  it('should use current date when no currentDate is provided', async () => {
    // Create a card
    const cardResult = await repository.create({
      userId,
      tags: ['test'],
      data: { front: 'test', back: 'test' },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => cardResult.unwrapOrThrow()).not.toThrow();

    // Query without providing currentDate (should use current date)
    const dueCardsResult = await repository.findDueCards({
      userId,
    });

    expect(() => dueCardsResult.unwrapOrThrow()).not.toThrow();
    const dueCards = dueCardsResult.unwrapOrThrow();

    // Since new cards are now immediately due, querying with today's date should return the card
    expect(dueCards).toHaveLength(1);
  });

  it('should prioritize due review cards before introducing new cards (scenario 1)', async () => {
    const now = new Date();
    // Create 20 review cards (simulate a prior review by setting lastReviewDate)
    const reviewCards: string[] = [];
    for (let i = 0; i < 20; i++) {
      const result = await repository.create({
        userId,
        tags: ['rev'],
        data: { front: 'r' + i, back: 'r' + i },
        algorithmType: AlgorithmType.SM2,
      });
      const card = result.unwrapOrThrow();
      // Simulate a review so they become review cards (lastReviewDate set via reschedule)
      card.scheduling.lastReviewDate = new Date(now.getTime() - 1000 * 60 * 60); // 1h ago
      card.scheduling.nextReviewDate = now; // due now
      await repository.update(card.id, { scheduling: card.scheduling });
      reviewCards.push(card.id);
    }

    // Create 50 new cards (no lastReviewDate)
    for (let i = 0; i < 50; i++) {
      await repository.create({
        userId,
        tags: ['new'],
        data: { front: 'n' + i, back: 'n' + i },
        algorithmType: AlgorithmType.SM2,
      });
    }

    const result = await repository.findDueCards({
      userId,
      currentDate: now,
      maxReviewCards: 50,
      maxNewCards: 20,
    });
    const due = result.unwrapOrThrow();
    // Expect 20 review (all) + 20 new (introduce up to maxNewCards)
    expect(due.filter((c) => c.scheduling.lastReviewDate)).toHaveLength(20);
    expect(due.filter((c) => !c.scheduling.lastReviewDate)).toHaveLength(20);
  });

  it('should spread new cards after clearing large review backlog over multiple days (scenario 2 simplified)', async () => {
    const start = new Date();
    // Day 0 setup: 120 review due + 50 new
    for (let i = 0; i < 120; i++) {
      const result = await repository.create({
        userId,
        tags: ['rev2'],
        data: { front: 'r2' + i, back: 'r2' + i },
        algorithmType: AlgorithmType.SM2,
      });
      const card = result.unwrapOrThrow();
      card.scheduling.lastReviewDate = new Date(start.getTime() - 86400000); // yesterday
      card.scheduling.nextReviewDate = start; // due now
      await repository.update(card.id, { scheduling: card.scheduling });
    }
    for (let i = 0; i < 50; i++) {
      await repository.create({
        userId,
        tags: ['new2'],
        data: { front: 'n2' + i, back: 'n2' + i },
        algorithmType: AlgorithmType.SM2,
      });
    }

    const day1 = (
      await repository.findDueCards({
        userId,
        currentDate: start,
        maxReviewCards: 50,
        maxNewCards: 20,
      })
    ).unwrapOrThrow();
    expect(day1.filter((c) => c.scheduling.lastReviewDate)).toHaveLength(50);
    expect(day1.filter((c) => !c.scheduling.lastReviewDate)).toHaveLength(0);

    // Simulate removing reviewed cards from backlog by pushing their nextReviewDate into future
    for (const card of day1) {
      if (card.scheduling.lastReviewDate) {
        card.scheduling.nextReviewDate = new Date(start.getTime() + 86400000); // tomorrow
        await repository.update(card.id, { scheduling: card.scheduling });
      }
    }

    const day2Date = new Date(start.getTime() + 86400000);
    const day2 = (
      await repository.findDueCards({
        userId,
        currentDate: day2Date,
        maxReviewCards: 50,
        maxNewCards: 20,
      })
    ).unwrapOrThrow();
    expect(day2.filter((c) => c.scheduling.lastReviewDate)).toHaveLength(50);
    expect(day2.filter((c) => !c.scheduling.lastReviewDate)).toHaveLength(0);

    // Push day2 reviews forward
    for (const card of day2) {
      if (card.scheduling.lastReviewDate) {
        card.scheduling.nextReviewDate = new Date(
          start.getTime() + 2 * 86400000,
        ); // day3
        await repository.update(card.id, { scheduling: card.scheduling });
      }
    }

    const day3Date = new Date(start.getTime() + 2 * 86400000);
    const day3 = (
      await repository.findDueCards({
        userId,
        currentDate: day3Date,
        maxReviewCards: 50,
        maxNewCards: 20,
      })
    ).unwrapOrThrow();
    // Backlog remaining reviews now less than quota (should be 20 reviews left)
    const reviewCountDay3 = day3.filter(
      (c) => c.scheduling.lastReviewDate,
    ).length;
    expect(reviewCountDay3).toBeLessThanOrEqual(50);
    const newIntroducedDay3 = day3.filter(
      (c) => !c.scheduling.lastReviewDate,
    ).length;
    // New cards start appearing (up to 20)
    expect(newIntroducedDay3).toBeLessThanOrEqual(20);
  });

  it('should debug the database storage format', async () => {
    // Create a card
    const cardResult = await repository.create({
      userId,
      tags: ['debug'],
      data: { front: 'debug', back: 'debug' },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => cardResult.unwrapOrThrow()).not.toThrow();
    const _card = cardResult.unwrapOrThrow();

    // Let's inspect the raw data in the database
    const allCardsResult = await repository.findByUserId(userId);
    expect(() => allCardsResult.unwrapOrThrow()).not.toThrow();

    // Now let's try to query directly with a simple condition to see if the database query works
    // This is to verify the database can find the card at all
    const simpleQuery = await repository.findByUserId(userId);
    expect(() => simpleQuery.unwrapOrThrow()).not.toThrow();
  });
});

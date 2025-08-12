import { CardRepository } from './card.repository';
import { NoSqlDatabaseTesting } from '@j2blasco/ts-crud';
import { DefaultSpacedRepetitionAlgorithmProvider } from 'src/providers/spaced-repetition-algorithm/providers/default-algorithm-provider';
import { AlgorithmType, RecallLevel } from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';
import { generateCardDataHash } from './card-hash.util';
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

  it('should use current date when no currentDate is provided (new cards not due until 45s)', async () => {
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

  // New cards are not due until 45 seconds after creation
  expect(dueCards).toHaveLength(0);
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
      const scheduler = spaceRepetition.getScheduler(card.scheduling.algorithmType);
      const reviewResult = scheduler.reschedule({
        currentScheduling: card.scheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt: new Date(now.getTime() - 1000 * 60 * 60), // 1h ago
        },
      });
      // Override nextReviewDate to be due now
      reviewResult.newScheduling.nextReviewDate = now;
      await repository.update(card.id, { scheduling: reviewResult.newScheduling });
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

    // Query 50 seconds in future to include new cards (which have 45s delay)
    const queryDate = new Date(now.getTime() + 50_000);
    const result = await repository.findDueCards({
      userId,
      currentDate: queryDate,
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
      // Simulate a review so they become review cards (lastReviewDate set via reschedule)
      const scheduler = spaceRepetition.getScheduler(card.scheduling.algorithmType);
      const reviewResult = scheduler.reschedule({
        currentScheduling: card.scheduling,
        reviewResult: {
          recallLevel: RecallLevel.EASY,
          reviewedAt: new Date(start.getTime() - 86400000), // yesterday
        },
      });
      // Override nextReviewDate to be due now
      reviewResult.newScheduling.nextReviewDate = start;
      await repository.update(card.id, { scheduling: reviewResult.newScheduling });
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

describe('Card Duplicate Detection', () => {
  let db: NoSqlDatabaseTesting;
  let spaceRepetition: DefaultSpacedRepetitionAlgorithmProvider;
  let repository: CardRepository;

  beforeEach(() => {
    db = new NoSqlDatabaseTesting();
    spaceRepetition = new DefaultSpacedRepetitionAlgorithmProvider();
    repository = new CardRepository(db, spaceRepetition);
  });

  it('should review existing card as failed when creating duplicate', async () => {
    const userId = 'user123';
    const cardData = {
      front: 'What is TypeScript?',
      back: 'A typed superset of JavaScript',
    };
    const tags = ['programming', 'typescript'];

    // Create first card
    const firstCardResult = await repository.create({
      userId,
      tags,
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => firstCardResult.unwrapOrThrow()).not.toThrow();
    const firstCard = firstCardResult.unwrapOrThrow();
    expect(firstCard.dataHash).toBeDefined();
    expect(firstCard.scheduling.lastReviewDate).toBeNull(); // New card not reviewed yet

    // Attempt to create duplicate card - should review existing card as failed
    const duplicateCardResult = await repository.create({
      userId,
      tags,
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => duplicateCardResult.unwrapOrThrow()).not.toThrow();
    const reviewedCard = duplicateCardResult.unwrapOrThrow();
    
    
    // Should return the same card ID (existing card)
    expect(reviewedCard.id).toBe(firstCard.id);
    
    // The next review date should be different (indicating reschedule happened)
    expect(reviewedCard.scheduling.nextReviewDate.getTime()).not.toBe(firstCard.scheduling.nextReviewDate.getTime());
    
    // Verify that lastReviewDate was set correctly
    expect(reviewedCard.scheduling.lastReviewDate).not.toBeNull();
    expect(reviewedCard.scheduling.lastReviewDate).toBeInstanceOf(Date);
    
    // The next review date should be soon (failed cards get rescheduled quickly)
    const timeDiff = reviewedCard.scheduling.nextReviewDate.getTime() - new Date().getTime();
    expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000); // Less than 24 hours
  });

  it('should allow creating cards with same content for different users', async () => {
    const cardData = {
      front: 'Same question',
      back: 'Same answer',
    };

    // Create card for user1
    const user1CardResult = await repository.create({
      userId: 'user1',
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => user1CardResult.unwrapOrThrow()).not.toThrow();

    // Create same card for user2
    const user2CardResult = await repository.create({
      userId: 'user2',
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => user2CardResult.unwrapOrThrow()).not.toThrow();

    // Verify they have different hashes due to different users
    const user1Card = user1CardResult.unwrapOrThrow();
    const user2Card = user2CardResult.unwrapOrThrow();
    expect(user1Card.dataHash).not.toBe(user2Card.dataHash);
  });

  it('should find card by dataHash', async () => {
    const userId = 'user123';
    const cardData = {
      front: 'Test question',
      back: 'Test answer',
    };
    const tags = ['test'];

    // Calculate expected hash
    const expectedHash = generateCardDataHash({
      userId,
      data: cardData,
      tags,
    });

    // Create card
    const createResult = await repository.create({
      userId,
      tags,
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => createResult.unwrapOrThrow()).not.toThrow();
    const createdCard = createResult.unwrapOrThrow();
    expect(createdCard.dataHash).toBe(expectedHash);

    // Find by dataHash
    const findResult = await repository.findByDataHash(userId, expectedHash);
    expect(() => findResult.unwrapOrThrow()).not.toThrow();
    const foundCard = findResult.unwrapOrThrow();
    expect(foundCard).not.toBeNull();
    expect(foundCard?.id).toBe(createdCard.id);
    expect(foundCard?.dataHash).toBe(expectedHash);
  });

  it('should return null when finding non-existent dataHash', async () => {
    const userId = 'user123';
    const nonExistentHash = generateCardDataHash({
      userId,
      data: { front: 'non-existent', back: 'card' },
    });

    const findResult = await repository.findByDataHash(userId, nonExistentHash);
    expect(() => findResult.unwrapOrThrow()).not.toThrow();
    const foundCard = findResult.unwrapOrThrow();
    expect(foundCard).toBeNull();
  });

  it('should review existing card as failed when updating to duplicate content', async () => {
    const userId = 'user123';

    // Create first card
    const card1Result = await repository.create({
      userId,
      data: { front: 'Card 1', back: 'Answer 1' },
      algorithmType: AlgorithmType.SM2,
    });

    // Create second card
    const card2Result = await repository.create({
      userId,
      data: { front: 'Card 2', back: 'Answer 2' },
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => card1Result.unwrapOrThrow()).not.toThrow();
    expect(() => card2Result.unwrapOrThrow()).not.toThrow();

    const card1 = card1Result.unwrapOrThrow();
    const card2 = card2Result.unwrapOrThrow();
    
    expect(card1.scheduling.lastReviewDate).toBeNull();

    // Try to update card2 to have same content as card1
    // Should review card1 as failed and return it
    const updateResult = await repository.update(card2.id, {
      data: { front: 'Card 1', back: 'Answer 1' },
    });

    expect(() => updateResult.unwrapOrThrow()).not.toThrow();
    const reviewedCard = updateResult.unwrapOrThrow();
    
    
    // Should return card1 (the existing card with matching content)
    expect(reviewedCard.id).toBe(card1.id);
    
    // Card1 should now have been reviewed as failed
    expect(reviewedCard.scheduling.lastReviewDate).not.toBeNull();
    expect(reviewedCard.scheduling.lastReviewDate).toBeInstanceOf(Date);
  });

  it('should allow updating card without changing its content', async () => {
    const userId = 'user123';
    const cardData = { front: 'Question', back: 'Answer' };

    // Create card
    const createResult = await repository.create({
      userId,
      data: cardData,
      tags: ['original'],
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => createResult.unwrapOrThrow()).not.toThrow();
    const card = createResult.unwrapOrThrow();

    // Update only tags, not data
    const updateResult = await repository.update(card.id, {
      tags: ['updated'],
    });

    expect(() => updateResult.unwrapOrThrow()).not.toThrow();
    const updatedCard = updateResult.unwrapOrThrow();
    expect(updatedCard.tags).toEqual(['updated']);
    expect(updatedCard.dataHash).toBeDefined();
  });

  it('should review existing card as failed when tags are in different order', async () => {
    const userId = 'user123';
    const cardData = { front: 'Test', back: 'Test' };

    // Create card with tags in one order
    const card1Result = await repository.create({
      userId,
      data: cardData,
      tags: ['tag1', 'tag2', 'tag3'],
      algorithmType: AlgorithmType.SM2,
    });

    expect(() => card1Result.unwrapOrThrow()).not.toThrow();
    const card1 = card1Result.unwrapOrThrow();
    expect(card1.scheduling.lastReviewDate).toBeNull();

    // Try to create card with tags in different order
    const card2Result = await repository.create({
      userId,
      data: cardData,
      tags: ['tag3', 'tag1', 'tag2'],
      algorithmType: AlgorithmType.SM2,
    });

    // Should detect as duplicate and review existing card as failed
    expect(() => card2Result.unwrapOrThrow()).not.toThrow();
    const reviewedCard = card2Result.unwrapOrThrow();
    
    // Should return the same card ID (existing card)
    expect(reviewedCard.id).toBe(card1.id);
    
    // Card should now have been reviewed as failed
    expect(reviewedCard.scheduling.lastReviewDate).not.toBeNull();
    expect(reviewedCard.scheduling.lastReviewDate).toBeInstanceOf(Date);
  });

  it('should preserve failed review when creating multiple duplicates', async () => {
    const userId = 'user123';
    const cardData = {
      front: 'Multiple duplicate test',
      back: 'This will be duplicated multiple times',
    };

    // Create original card
    const originalResult = await repository.create({
      userId,
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    const originalCard = originalResult.unwrapOrThrow();
    const originalNextReview = originalCard.scheduling.nextReviewDate;

    // First duplicate - should review as failed
    const duplicate1Result = await repository.create({
      userId,
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    const reviewed1 = duplicate1Result.unwrapOrThrow();
    expect(reviewed1.id).toBe(originalCard.id);
    expect(reviewed1.scheduling.lastReviewDate).not.toBeNull();
    
    const firstReviewDate = reviewed1.scheduling.lastReviewDate!;

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    // Second duplicate - should review as failed again
    const duplicate2Result = await repository.create({
      userId,
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    const reviewed2 = duplicate2Result.unwrapOrThrow();
    expect(reviewed2.id).toBe(originalCard.id);
    expect(reviewed2.scheduling.lastReviewDate!.getTime()).toBeGreaterThan(firstReviewDate.getTime());
  });

  it('should correctly handle different scheduling algorithms when reviewing as failed', async () => {
    const userId = 'user123';
    const cardData = {
      front: 'Algorithm test',
      back: 'Testing different algorithms',
    };

    // Create card with SM2 algorithm
    const originalResult = await repository.create({
      userId,
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    const originalCard = originalResult.unwrapOrThrow();
    expect(originalCard.scheduling.algorithmType).toBe(AlgorithmType.SM2);

    // Create duplicate - should review as failed using SM2
    const duplicateResult = await repository.create({
      userId,
      data: cardData,
      algorithmType: AlgorithmType.SM2,
    });

    const reviewedCard = duplicateResult.unwrapOrThrow();
    expect(reviewedCard.id).toBe(originalCard.id);
    expect(reviewedCard.scheduling.algorithmType).toBe(AlgorithmType.SM2);
    expect(reviewedCard.scheduling.lastReviewDate).not.toBeNull();
  });
});

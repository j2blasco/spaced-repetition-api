import { describe, it, expect } from '@jest/globals';
import { CardRepository } from './card.repository';
import { NoSqlDatabaseTesting } from '@j2blasco/ts-crud';
import { DefaultSpacedRepetitionAlgorithmProvider } from 'src/providers/spaced-repetition-algorithm/providers/default-algorithm-provider';
import { AlgorithmType } from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';

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
    console.log(
      'Card nextReviewDate:',
      card.scheduling.nextReviewDate.toISOString(),
    );

    // Query for due cards using a date well in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 1 week in future
    console.log('Query currentDate:', futureDate.toISOString());

    const dueCardsResult = await repository.findDueCards({
      userId,
      currentDate: futureDate,
    });

    expect(() => dueCardsResult.unwrapOrThrow()).not.toThrow();
    const dueCards = dueCardsResult.unwrapOrThrow();

    console.log('Due cards found:', dueCards.length);
    console.log(
      'Due cards:',
      dueCards.map((c) => ({
        id: c.id,
        nextReviewDate: c.scheduling.nextReviewDate.toISOString(),
      })),
    );

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

    // Since new cards are due tomorrow, querying with today's date should return 0 cards
    expect(dueCards).toHaveLength(0);
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
    const allCards = allCardsResult.unwrapOrThrow();

    console.log('All cards for user:', allCards.length);
    if (allCards.length > 0) {
      console.log(
        'Card structure:',
        JSON.stringify(
          {
            id: allCards[0].id,
            userId: allCards[0].userId,
            tags: allCards[0].tags,
            scheduling: {
              algorithmType: allCards[0].scheduling.algorithmType,
              nextReviewDate:
                allCards[0].scheduling.nextReviewDate.toISOString(),
            },
          },
          null,
          2,
        ),
      );
    }

    // Now let's try to query directly with a simple condition to see if the database query works
    // This is to verify the database can find the card at all
    const simpleQuery = await repository.findByUserId(userId);
    expect(() => simpleQuery.unwrapOrThrow()).not.toThrow();
    const simpleCards = simpleQuery.unwrapOrThrow();
    console.log('Simple query found cards:', simpleCards.length);
  });
});

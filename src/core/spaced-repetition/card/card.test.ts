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

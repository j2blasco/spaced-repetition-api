import { describe, it, expect } from '@jest/globals';
import { InMemoryCardRepository } from './card.repository.memory';

describe('Simplified Card System', () => {
  it('should create and find cards with tags', async () => {
    const repository = new InMemoryCardRepository();
    const userId = 'user123';

    // Create a Spanish vocabulary card
    const card = await repository.create({
      userId,
      tags: ['spanish', 'vocabulary', 'beginner'],
      data: {
        front: 'Hello',
        back: 'Hola',
        cardType: 'basic',
      },
    });

    expect(card.id).toBeDefined();
    expect(card.userId).toBe(userId);
    expect(card.tags).toEqual(['spanish', 'vocabulary', 'beginner']);
    expect(card.data.front).toBe('Hello');
    expect(card.data.back).toBe('Hola');

    // Find cards by tags
    const spanishCards = await repository.findByTags(userId, ['spanish']);
    expect(spanishCards).toHaveLength(1);
    expect(spanishCards[0].id).toBe(card.id);

    // Find cards by user
    const userCards = await repository.findByUserId(userId);
    expect(userCards).toHaveLength(1);
    expect(userCards[0].id).toBe(card.id);
  });

  it('should support flexible data structures', async () => {
    const repository = new InMemoryCardRepository();
    const userId = 'user123';

    // Create a math problem card
    const mathCard = await repository.create({
      userId,
      tags: ['math', 'algebra', 'quadratic'],
      data: {
        problem: 'Solve: x² + 5x + 6 = 0',
        solution: 'x = -2 or x = -3',
        steps: ['factor', 'set equal to zero'],
        cardType: 'problem',
        difficulty: 'medium',
      },
    });

    expect(mathCard.data.problem).toBe('Solve: x² + 5x + 6 = 0');
    expect(mathCard.data.steps).toEqual(['factor', 'set equal to zero']);
    expect(mathCard.data.difficulty).toBe('medium');

    // Create a cloze deletion card
    const clozeCard = await repository.create({
      userId,
      tags: ['history', 'dates'],
      data: {
        text: 'World War II ended in {{c1::1945}}',
        clozeType: 'deletion',
        field: 'c1',
        answer: '1945',
      },
    });

    expect(clozeCard.data.text).toBe('World War II ended in {{c1::1945}}');
    expect(clozeCard.data.answer).toBe('1945');

    // Verify we can find by different tag combinations
    const mathCards = await repository.findByTags(userId, ['math']);
    const historyCards = await repository.findByTags(userId, ['history']);
    
    expect(mathCards).toHaveLength(1);
    expect(historyCards).toHaveLength(1);
    expect(mathCards[0].id).toBe(mathCard.id);
    expect(historyCards[0].id).toBe(clozeCard.id);
  });

  it('should get card counts by tags', async () => {
    const repository = new InMemoryCardRepository();
    const userId = 'user123';

    await repository.create({
      userId,
      tags: ['spanish', 'vocabulary'],
      data: { front: 'Hello', back: 'Hola' },
    });

    await repository.create({
      userId,
      tags: ['spanish', 'grammar'],
      data: { front: 'I am', back: 'Yo soy' },
    });

    await repository.create({
      userId,
      tags: ['french', 'vocabulary'],
      data: { front: 'Hello', back: 'Bonjour' },
    });

    const counts = await repository.getCardCountsByTags(userId);
    
    expect(counts.spanish).toBe(2);
    expect(counts.vocabulary).toBe(2);
    expect(counts.grammar).toBe(1);
    expect(counts.french).toBe(1);
  });
});

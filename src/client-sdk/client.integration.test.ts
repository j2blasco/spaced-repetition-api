import SpacedRepetitionClient from './index';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RestServerTestbed } from 'src/api/rest/rest-server-testbed.utils.test';

describe('SpacedRepetitionClient Integration Tests', () => {
  let client: SpacedRepetitionClient;

  let testbed: RestServerTestbed;

  beforeAll(async () => {
    testbed = await RestServerTestbed.create({ intialPort: 4000 });
    client = new SpacedRepetitionClient({
      baseUrl: `http://localhost:${testbed.port}`,
      timeout: 10000,
    });
  });

  afterAll(async () => {
    await testbed.dispose();
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const result = await client.healthCheck();
      expect(result).toBeDefined();
    });
  });

  describe('User Management', () => {
    let userId: string;

    it('should create a user', async () => {
      const user = await client.createUser({
        preferences: {
          maxNewCardsPerDay: 20,
          maxReviewsPerDay: 100,
          timezone: 'UTC',
        },
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.preferences?.maxNewCardsPerDay).toBe(20);
      userId = user.id;
    });

    it('should get a user by id', async () => {
      const user = await client.getUser(userId);
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.preferences?.maxNewCardsPerDay).toBe(20);
    });

    it('should delete a user', async () => {
      await expect(client.deleteUser(userId)).resolves.not.toThrow();
    });
  });

  describe('Card Management', () => {
    let userId: string;
    let cardId: string;

    beforeAll(async () => {
      // Create a user for card tests
      const user = await client.createUser({
        preferences: {
          maxNewCardsPerDay: 20,
          maxReviewsPerDay: 100,
          timezone: 'UTC',
        },
      });
      userId = user.id;
    });

    afterAll(async () => {
      // Clean up user and cards
      await client.deleteUser(userId);
    });

    it('should create a card', async () => {
      const cardData = {
        question: 'What is the capital of France?',
        answer: 'Paris',
        difficulty: 'easy',
      };

      const card = await client.createCard({
        userId,
        tags: ['geography', 'capitals'],
        data: cardData,
        algorithmType: 'sm2',
      });

      expect(card).toBeDefined();
      expect(card.id).toBeDefined();
      expect(card.userId).toBe(userId);
      expect(card.tags).toEqual(['geography', 'capitals']);
      expect(card.data).toEqual(cardData);
      expect(card.scheduling).toBeDefined();
      expect(card.scheduling.algorithmType).toBe('sm2');
      expect(card.scheduling.nextReviewDate).toBeDefined();
      expect(card.createdAt).toBeDefined();
      expect(card.updatedAt).toBeDefined();

      cardId = card.id;
    });

    it('should get a card by id', async () => {
      const card = await client.getCard(cardId);

      expect(card).toBeDefined();
      expect(card.id).toBe(cardId);
      expect(card.userId).toBe(userId);
      expect(card.data.question).toBe('What is the capital of France?');
    });

    it('should get user cards', async () => {
      const cards = await client.getUserCards(userId);

      expect(cards).toBeDefined();
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.some((card) => card.id === cardId)).toBe(true);
    });

    it('should update a card', async () => {
      const updatedData = {
        question: 'What is the capital of France? (Updated)',
        answer: 'Paris',
        difficulty: 'medium',
      };

      const updatedCard = await client.updateCard(cardId, {
        tags: ['geography', 'capitals', 'europe'],
        data: updatedData,
      });

      expect(updatedCard.id).toBe(cardId);
      expect(updatedCard.tags).toEqual(['geography', 'capitals', 'europe']);
      expect(updatedCard.data).toEqual(updatedData);
      expect(updatedCard.updatedAt).not.toBe(updatedCard.createdAt);
    });

    it('should get due cards (after 45 seconds delay for new cards)', async () => {
      // New cards are not due immediately; query with currentDate > 45s in future
      const future = new Date(Date.now() + 46_000).toISOString();
      const dueCards = await client.getDueCards({
        userId,
        limit: 10,
        currentDate: future,
      });

      expect(dueCards).toBeDefined();
      expect(Array.isArray(dueCards)).toBe(true);
      expect(dueCards.some((card) => card.id === cardId)).toBe(true);
    });

    it('should get due cards with tags filter (after delay)', async () => {
      const future = new Date(Date.now() + 46_000).toISOString();
      const dueCards = await client.getDueCards({
        userId,
        tags: ['geography'],
        limit: 10,
        currentDate: future,
      });

      expect(dueCards).toBeDefined();
      expect(Array.isArray(dueCards)).toBe(true);
      expect(dueCards.some((card) => card.id === cardId)).toBe(true);
    });

    it('should delete a card', async () => {
      await expect(client.deleteCard(cardId)).resolves.not.toThrow();

      // Verify card is deleted
      await expect(client.getCard(cardId)).rejects.toThrow();
    });
  });

  describe('Card Review System', () => {
    let userId: string;
    let cardIds: string[] = [];

    beforeAll(async () => {
      // Create a user for review tests
      const user = await client.createUser({
        preferences: {
          maxNewCardsPerDay: 20,
          maxReviewsPerDay: 100,
          timezone: 'UTC',
        },
      });
      userId = user.id;

      // Create multiple cards for review testing
      const cardPromises = [
        {
          question: 'What is 2 + 2?',
          answer: '4',
          subject: 'math',
        },
        {
          question: 'What is the largest planet?',
          answer: 'Jupiter',
          subject: 'astronomy',
        },
        {
          question: 'Who wrote Romeo and Juliet?',
          answer: 'William Shakespeare',
          subject: 'literature',
        },
      ].map((data) =>
        client.createCard({
          userId,
          tags: [data.subject],
          data,
          algorithmType: 'sm2',
        }),
      );

      const cards = await Promise.all(cardPromises);
      cardIds = cards.map((card) => card.id);
    });

    afterAll(async () => {
      // Clean up
      await client.deleteUser(userId);
    });

    it('should review a card with good response', async () => {
      const cardId = cardIds[0];
      const originalCard = await client.getCard(cardId);

      const reviewResponse = await client.reviewCard(cardId, {
        response: 'good',
        reviewedAt: new Date().toISOString(),
      });

      expect(reviewResponse).toBeDefined();
      expect(reviewResponse.cardId).toBe(cardId);
      expect(reviewResponse.reviewResponse).toBe('good');
      expect(reviewResponse.reviewedAt).toBeDefined();
      expect(reviewResponse.newScheduling).toBeDefined();
      expect(reviewResponse.updatedCard).toBeDefined();

      // Check that the next review date has been updated
      expect(
        new Date(reviewResponse.newScheduling.nextReviewDate).getTime(),
      ).toBeGreaterThan(
        new Date(originalCard.scheduling.nextReviewDate).getTime(),
      );
    });

    it('should review a card with failed response', async () => {
      const cardId = cardIds[1];

      const reviewResponse = await client.reviewCard(cardId, {
        response: 'failed',
      });

      expect(reviewResponse).toBeDefined();
      expect(reviewResponse.reviewResponse).toBe('failed');

      // Failed reviews typically schedule the card sooner
      const nextReview = new Date(reviewResponse.newScheduling.nextReviewDate);
      const now = new Date();
      expect(nextReview.getTime() - now.getTime()).toBeLessThan(
        24 * 60 * 60 * 1000,
      ); // Less than 24 hours
    });

    it('should review a card with easy response', async () => {
      const cardId = cardIds[2];

      const reviewResponse = await client.reviewCard(cardId, {
        response: 'easy',
      });

      expect(reviewResponse).toBeDefined();
      expect(reviewResponse.reviewResponse).toBe('easy');

      // Easy reviews typically schedule the card farther out
      const nextReview = new Date(reviewResponse.newScheduling.nextReviewDate);
      const now = new Date();
      // Allow for some tolerance (23 hours minimum instead of exactly 24)
      expect(nextReview.getTime() - now.getTime()).toBeGreaterThan(
        23 * 60 * 60 * 1000,
      ); // More than 23 hours
    });

  it('should create and complete a study session (cards due after delay)', async () => {
      // Create additional cards for study session
      const sessionCard = await client.createCard({
        userId,
        tags: ['session-test'],
        data: {
          question: 'What is a study session?',
          answer: 'A period of focused learning',
        },
      });

      const studySession = await client.createStudySession(userId, {
        tags: ['session-test'],
        limit: 5,
        currentDate: new Date(Date.now() + 46_000),
      });

      expect(studySession).toBeDefined();
      expect(studySession.dueCards).toBeDefined();
      expect(Array.isArray(studySession.dueCards)).toBe(true);
      expect(studySession.totalDue).toBe(studySession.dueCards.length);
      expect(
        studySession.dueCards.some((card) => card.id === sessionCard.id),
      ).toBe(true);
    });

    it('should batch review multiple cards', async () => {
      // Create cards specifically for batch review
      const batchCards = await Promise.all([
        client.createCard({
          userId,
          tags: ['batch-test'],
          data: { question: 'Batch question 1', answer: 'Answer 1' },
        }),
        client.createCard({
          userId,
          tags: ['batch-test'],
          data: { question: 'Batch question 2', answer: 'Answer 2' },
        }),
      ]);

      const reviews = batchCards.map((card) => ({
        cardId: card.id,
        response: 'good' as const,
      }));

      const batchResults = await client.batchReviewCards(reviews);

      expect(batchResults).toBeDefined();
      expect(Array.isArray(batchResults)).toBe(true);
      expect(batchResults.length).toBe(2);

      batchResults.forEach((result, index) => {
        expect(result.cardId).toBe(batchCards[index].id);
        expect(result.reviewResponse).toBe('good');
        expect(result.newScheduling).toBeDefined();
      });
    });

    it('should get study statistics', async () => {
      const stats = await client.getStudyStats(userId);

      expect(stats).toBeDefined();
      expect(typeof stats.totalCards).toBe('number');
      expect(typeof stats.dueCards).toBe('number');
      expect(typeof stats.dueToday).toBe('number');
      expect(stats.totalCards).toBeGreaterThan(0);
      expect(stats.dueCards).toBeGreaterThanOrEqual(0);
      expect(stats.dueToday).toBeGreaterThanOrEqual(0);
    });

    it('should get study statistics with tag filter', async () => {
      const stats = await client.getStudyStats(userId, {
        tags: ['math'],
      });

      expect(stats).toBeDefined();
      expect(typeof stats.totalCards).toBe('number');
      expect(stats.totalCards).toBeGreaterThanOrEqual(0);
    });

    it('should create card, review it to reschedule, and verify due cards behavior', async () => {
      // Create a new card for this specific test
      const card = await client.createCard({
        userId,
        tags: ['scheduling-test'],
        data: {
          question: 'What is the test for scheduling?',
          answer: 'Verifying review scheduling works correctly',
        },
        algorithmType: 'sm2',
      });

      // Verify the new card is not immediately due
      const initialDueCards = await client.getDueCards({
        userId,
        tags: ['scheduling-test'],
        limit: 10,
      });
      expect(initialDueCards.some((c) => c.id === card.id)).toBe(false);

      // But it should appear after 45 seconds
      const dueAfterDelay = await client.getDueCards({
        userId,
        tags: ['scheduling-test'],
        limit: 10,
        currentDate: new Date(Date.now() + 46_000).toISOString(),
      });
      expect(dueAfterDelay.some((c) => c.id === card.id)).toBe(true);

      // Review the card with a 'good' response to reschedule it
      const reviewResponse = await client.reviewCard(card.id, {
        response: 'good',
        reviewedAt: new Date().toISOString(),
      });

      expect(reviewResponse).toBeDefined();
      expect(reviewResponse.cardId).toBe(card.id);
      expect(reviewResponse.reviewResponse).toBe('good');
      expect(reviewResponse.newScheduling).toBeDefined();

      // Verify the card is now scheduled for a future date
      const nextReviewDate = new Date(
        reviewResponse.newScheduling.nextReviewDate,
      );
      const now = new Date();
      expect(nextReviewDate.getTime()).toBeGreaterThan(now.getTime());

      // Verify the card is no longer in due cards (since it's scheduled for the future)
      const currentDueCards = await client.getDueCards({
        userId,
        tags: ['scheduling-test'],
        limit: 10,
      });
      expect(currentDueCards.some((c) => c.id === card.id)).toBe(false);

      // Simulate time passing to when the card should be due again
      // Note: In a real scenario with time manipulation, we could advance time
      // For now, we'll verify the scheduling data is correct
      const updatedCard = await client.getCard(card.id);
      expect(updatedCard.scheduling.nextReviewDate).toBe(
        reviewResponse.newScheduling.nextReviewDate,
      );

      // Verify SM2 algorithm data is updated correctly
      const sm2Data = updatedCard.scheduling.algorithmData as {
        efactor: number;
        repetition: number;
      };
      expect(sm2Data.repetition).toBeGreaterThan(0);
      expect(sm2Data.efactor).toBeDefined();
      expect(sm2Data.efactor).toBeGreaterThan(1.0);
    });
  });
});

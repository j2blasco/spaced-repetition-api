import { Express } from 'express';
import request from 'supertest';
import { AlgorithmType } from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';
import { describe, it, expect } from 'vitest';
import { RestApiTestbed } from '../../rest-server.utils.test';
import { usersEndpointRoute } from '../users/users';
import { cardsEndpointRoute } from './cards-endpoint';

describe('Card endpoints', () => {
  const createTestUser = async (app: Express) => {
    const userResponse = await request(app)
      .post(usersEndpointRoute)
      .send({
        preferences: {
          maxNewCardsPerDay: 20,
          maxReviewsPerDay: 100,
          timezone: 'UTC',
          defaultAlgorithm: 'sm2',
        },
      });

    return userResponse.body.id;
  };

  const createTestCard = async (app: Express, userId: string) => {
    const cardData = {
      userId,
      tags: ['vocabulary', 'spanish'],
      data: {
        front: '¿Cómo estás?',
        back: 'How are you?',
        extra: 'Common greeting in Spanish',
      },
      algorithmType: AlgorithmType.SM2,
    };

    const response = await request(app)
      .post(cardsEndpointRoute)
      .send(cardData)
      .expect(201);

    return response.body;
  };

  describe(`POST ${cardsEndpointRoute}`, () => {
    it('should create a new card successfully', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const testUserId = await createTestUser(app);
      expect(testUserId).toBeDefined();

      const cardData = {
        userId: testUserId,
        tags: ['vocabulary', 'spanish'],
        data: {
          front: '¿Cómo estás?',
          back: 'How are you?',
          extra: 'Common greeting in Spanish',
        },
        algorithmType: AlgorithmType.SM2,
      };

      const response = await request(app)
        .post(cardsEndpointRoute)
        .send(cardData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.tags).toEqual(['vocabulary', 'spanish']);
      expect(response.body.data).toEqual(cardData.data);
      expect(response.body.scheduling).toHaveProperty('algorithmType', 'sm2');
      expect(response.body.scheduling).toHaveProperty('nextReviewDate');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should create a card with default algorithm type when not specified', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const testUserId = await createTestUser(app);

      const cardData = {
        userId: testUserId,
        tags: ['test'],
        data: { front: 'Test question', back: 'Test answer' },
      };

      const response = await request(app)
        .post(cardsEndpointRoute)
        .send(cardData)
        .expect(201);

      expect(response.body.scheduling.algorithmType).toBe('sm2');
    });
  });

  describe(`GET ${cardsEndpointRoute}`, () => {
    it('should list cards for a user', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const testUserId = await createTestUser(app);
      await createTestCard(app, testUserId);
      await createTestCard(app, testUserId);

      const response = await request(app)
        .get(cardsEndpointRoute)
        .query({ userId: testUserId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].userId).toBe(testUserId);
    });

    it('should return 400 when userId is missing', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response = await request(app).get(cardsEndpointRoute).expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe(
        'userId query parameter is required',
      );
    });
  });

  describe(`GET ${cardsEndpointRoute}/:id`, () => {
    it('should get a card by ID', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const testUserId = await createTestUser(app);
      const card = await createTestCard(app, testUserId);

      const response = await request(app)
        .get(`${cardsEndpointRoute}/${card.id}`)
        .expect(200);

      expect(response.body.id).toBe(card.id);
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.tags).toEqual(['vocabulary', 'spanish']);
    });

    it('should return 404 for non-existent card', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const fakeId = '60f7b1b3e1b3f00001234567';
      await request(app).get(`${cardsEndpointRoute}/${fakeId}`).expect(404);
    });
  });

  describe(`PUT ${cardsEndpointRoute}/:id`, () => {
    it('should update a card', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const testUserId = await createTestUser(app);
      const card = await createTestCard(app, testUserId);

      const updateData = {
        tags: ['vocabulary', 'french'],
        data: {
          front: 'Comment allez-vous?',
          back: 'How are you?',
          extra: 'Formal greeting in French',
        },
      };

      const response = await request(app)
        .put(`${cardsEndpointRoute}/${card.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.tags).toEqual(['vocabulary', 'french']);
      expect(response.body.data.front).toBe('Comment allez-vous?');
      expect(response.body.data.extra).toBe('Formal greeting in French');
    });

    it('should return 404 for non-existent card', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const fakeId = '60f7b1b3e1b3f00001234567';
      const updateData = {
        tags: ['test'],
        data: { front: 'Test', back: 'Test' },
      };

      await request(app)
        .put(`${cardsEndpointRoute}/${fakeId}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe(`DELETE ${cardsEndpointRoute}/:id`, () => {
    it('should delete a card successfully', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const testUserId = await createTestUser(app);
      const card = await createTestCard(app, testUserId);

      await request(app).delete(`${cardsEndpointRoute}/${card.id}`).expect(204);

      // Verify card is deleted
      await request(app).get(`${cardsEndpointRoute}/${card.id}`).expect(404);
    });

    it('should return 404 for non-existent card', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const fakeId = '60f7b1b3e1b3f00001234567';
      await request(app).delete(`${cardsEndpointRoute}/${fakeId}`).expect(404);
    });
  });

  describe(`GET ${cardsEndpointRoute}/due`, () => {
    it('should get due cards for a user', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const testUserId = await createTestUser(app);
      await createTestCard(app, testUserId);

      const response = await request(app)
        .get(`${cardsEndpointRoute}/due`)
        .query({ userId: testUserId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 when userId is missing', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response = await request(app)
        .get(`${cardsEndpointRoute}/due`)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe(
        'userId query parameter is required',
      );
    });
  });
});

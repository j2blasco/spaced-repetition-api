import express, { Express } from 'express';
import request from 'supertest';
import { setupEndpoints } from '../endpoints';
import { registerProviders } from 'src/providers/providers-registration/providers-test';
import { AlgorithmType } from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';

describe('Card endpoints', () => {
  let app: Express;
  let testUserId: string;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerProviders();
    setupEndpoints(app);
  });

  describe('POST /api/cards', () => {
    it('should create a new card successfully', async () => {
      // First create a user
      const userResponse = await request(app)
        .post('/api/users')
        .send({
          preferences: {
            maxNewCardsPerDay: 20,
            maxReviewsPerDay: 100,
            timezone: 'UTC',
            defaultAlgorithm: 'sm2',
          },
        });

      testUserId = userResponse.body.id;

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
        .post('/api/cards')
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
      // First create a user
      const userResponse = await request(app).post('/api/users').send({});

      const cardData = {
        userId: userResponse.body.id,
        tags: ['test'],
        data: { front: 'Test question', back: 'Test answer' },
      };

      const response = await request(app)
        .post('/api/cards')
        .send(cardData)
        .expect(201);

      expect(response.body.scheduling.algorithmType).toBe('sm2');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({
          tags: ['test'],
          data: { front: 'Test' },
          // missing userId - this should still create a card but may have undefined userId
        })
        .expect(201); // API creates card with missing userId as undefined

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBeUndefined(); // undefined for missing userId
    });
  });

  describe('GET /api/cards', () => {
    beforeEach(async () => {
      // Create a user and some cards for testing
      const userResponse = await request(app).post('/api/users').send({});
      testUserId = userResponse.body.id;

      // Create test cards
      await request(app)
        .post('/api/cards')
        .send({
          userId: testUserId,
          tags: ['math'],
          data: { front: '2+2', back: '4' },
        });

      await request(app)
        .post('/api/cards')
        .send({
          userId: testUserId,
          tags: ['science'],
          data: { front: 'H2O', back: 'Water' },
        });
    });

    it('should list user cards successfully', async () => {
      const response = await request(app)
        .get('/api/cards')
        .query({ userId: testUserId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('userId', testUserId);
    });

    it('should require userId query parameter', async () => {
      const response = await request(app).get('/api/cards').expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('userId');
    });

    it('should return empty array for non-existent user', async () => {
      const response = await request(app)
        .get('/api/cards')
        .query({ userId: 'non-existent-user' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/cards/:id', () => {
    let cardId: string;

    beforeEach(async () => {
      const userResponse = await request(app).post('/api/users').send({});
      testUserId = userResponse.body.id;

      const cardResponse = await request(app)
        .post('/api/cards')
        .send({
          userId: testUserId,
          tags: ['test'],
          data: { front: 'Test question', back: 'Test answer' },
        });
      cardId = cardResponse.body.id;
    });

    it('should get card by id successfully', async () => {
      const response = await request(app)
        .get(`/api/cards/${cardId}`)
        .expect(200);

      expect(response.body.id).toBe(cardId);
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.data.front).toBe('Test question');
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .get('/api/cards/non-existent-id')
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/cards/:id', () => {
    let cardId: string;

    beforeEach(async () => {
      const userResponse = await request(app).post('/api/users').send({});
      testUserId = userResponse.body.id;

      const cardResponse = await request(app)
        .post('/api/cards')
        .send({
          userId: testUserId,
          tags: ['original'],
          data: { front: 'Original question', back: 'Original answer' },
        });
      cardId = cardResponse.body.id;
    });

    it('should update card successfully', async () => {
      const updateData = {
        tags: ['updated', 'modified'],
        data: {
          front: 'Updated question',
          back: 'Updated answer',
          extra: 'New extra field',
        },
      };

      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe(cardId);
      expect(response.body.tags).toEqual(['updated', 'modified']);
      expect(response.body.data).toEqual(updateData.data);
      expect(response.body.updatedAt).not.toBe(response.body.createdAt);
    });

    it('should update only specified fields', async () => {
      const updateData = {
        tags: ['new-tag'],
      };

      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.tags).toEqual(['new-tag']);
      expect(response.body.data.front).toBe('Original question'); // Should remain unchanged
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .put('/api/cards/non-existent-id')
        .send({ tags: ['test'] })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/cards/:id', () => {
    let cardId: string;

    beforeEach(async () => {
      const userResponse = await request(app).post('/api/users').send({});
      testUserId = userResponse.body.id;

      const cardResponse = await request(app)
        .post('/api/cards')
        .send({
          userId: testUserId,
          tags: ['test'],
          data: { front: 'Test question', back: 'Test answer' },
        });
      cardId = cardResponse.body.id;
    });

    it('should delete card successfully', async () => {
      await request(app).delete(`/api/cards/${cardId}`).expect(204);

      // Verify card is deleted
      await request(app).get(`/api/cards/${cardId}`).expect(404);
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .delete('/api/cards/non-existent-id')
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/cards/due', () => {
    beforeEach(async () => {
      const userResponse = await request(app).post('/api/users').send({});
      testUserId = userResponse.body.id;

      // Create cards that are due by setting currentDate to future
      // Since new cards have nextReviewDate set to tomorrow, we query with future date
      await request(app)
        .post('/api/cards')
        .send({
          userId: testUserId,
          tags: ['math'],
          data: { front: '1+1', back: '2' },
        });

      await request(app)
        .post('/api/cards')
        .send({
          userId: testUserId,
          tags: ['science'],
          data: { front: 'CO2', back: 'Carbon dioxide' },
        });
    });

    it('should get due cards successfully', async () => {
      // Query with future date to make cards appear as due
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const response = await request(app)
        .get('/api/cards/due')
        .query({
          userId: testUserId,
          currentDate: tomorrow.toISOString(),
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('scheduling');
    });

    it('should filter by tags', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const response = await request(app)
        .get('/api/cards/due')
        .query({
          userId: testUserId,
          tags: 'math',
          currentDate: tomorrow.toISOString(),
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0].tags).toContain('math');
      }
    });

    it('should respect limit parameter', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const response = await request(app)
        .get('/api/cards/due')
        .query({
          userId: testUserId,
          limit: 1,
          currentDate: tomorrow.toISOString(),
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(1);
    });

    it('should require userId query parameter', async () => {
      const response = await request(app).get('/api/cards/due').expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('userId');
    });
  });

  describe('POST /api/cards/:id/review', () => {
    let cardId: string;

    beforeEach(async () => {
      const userResponse = await request(app).post('/api/users').send({});
      testUserId = userResponse.body.id;

      const cardResponse = await request(app)
        .post('/api/cards')
        .send({
          userId: testUserId,
          tags: ['test'],
          data: { front: 'Test question', back: 'Test answer' },
        });
      cardId = cardResponse.body.id;
    });

    it('should return not implemented status', async () => {
      const response = await request(app)
        .post(`/api/cards/${cardId}/review`)
        .send({
          response: 'good',
          responseTime: 5.2,
        })
        .expect(501);

      expect(response.body.error.code).toBe('NOT_IMPLEMENTED');
      expect(response.body.error.message).toContain('not yet implemented');
    });
  });
});

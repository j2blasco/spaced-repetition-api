import { Express } from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { RestServerTestbed } from '../../rest-server-testbed.utils.test';
import { usersEndpointRoute } from './users';

describe('User endpoints', () => {
  describe(`POST ${usersEndpointRoute}`, () => {
    it('should create a user with default preferences', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const response = await request(app)
        .post(usersEndpointRoute)
        .send({})
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.preferences).toBeDefined();
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should create a new user with custom preferences', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const userData = {
        preferences: {
          maxNewCardsPerDay: 25,
          maxReviewsPerDay: 150,
          defaultAlgorithm: 'fsrs',
        },
      };

      const response = await request(app)
        .post(usersEndpointRoute)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.preferences.maxNewCardsPerDay).toBe(25);
      expect(response.body.preferences.maxReviewsPerDay).toBe(150);
      expect(response.body.preferences.defaultAlgorithm).toBe('fsrs');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    describe(`GET ${usersEndpointRoute}/:id`, () => {
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

      it('should get a user by ID', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const userId = await createTestUser(app);

        const response = await request(app)
          .get(`${usersEndpointRoute}/${userId}`)
          .expect(200);

        expect(response.body.id).toBe(userId);
        expect(response.body.preferences.maxNewCardsPerDay).toBe(20);
        expect(response.body.preferences.maxReviewsPerDay).toBe(100);
        expect(response.body.preferences.defaultAlgorithm).toBe('sm2');
      });

      it('should return 404 for non-existent user', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const fakeId = '60f7b1b3e1b3f00001234567';
        await request(app).get(`${usersEndpointRoute}/${fakeId}`).expect(404);
      });

      it('should handle invalid user ID format', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const invalidId = 'invalid-id';
        await request(app)
          .get(`${usersEndpointRoute}/${invalidId}`)
          .expect(404);
      });
    });

    describe(`PUT ${usersEndpointRoute}/:id`, () => {
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

      it('should update user preferences', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const userId = await createTestUser(app);

        const updateData = {
          preferences: {
            maxNewCardsPerDay: 30,
            maxReviewsPerDay: 200,
            timezone: 'Europe/Paris',
            defaultAlgorithm: 'fsrs',
          },
        };

        const response = await request(app)
          .put(`${usersEndpointRoute}/${userId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.preferences.maxNewCardsPerDay).toBe(30);
        expect(response.body.preferences.maxReviewsPerDay).toBe(200);
        expect(response.body.preferences.timezone).toBe('Europe/Paris');
        expect(response.body.preferences.defaultAlgorithm).toBe('fsrs');
        expect(response.body.updatedAt).toBeDefined();
      });

      it('should update partial preferences', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const userId = await createTestUser(app);

        const updateData = {
          preferences: {
            maxNewCardsPerDay: 15,
            timezone: 'Asia/Tokyo',
          },
        };

        const response = await request(app)
          .put(`${usersEndpointRoute}/${userId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.preferences.maxNewCardsPerDay).toBe(15);
        expect(response.body.preferences.timezone).toBe('Asia/Tokyo');
        expect(response.body.preferences.maxReviewsPerDay).toBe(100);
        expect(response.body.preferences.defaultAlgorithm).toBe('sm2');
      });

      it('should return 404 for non-existent user', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const fakeId = '60f7b1b3e1b3f00001234567';
        const updateData = {
          preferences: {
            maxNewCardsPerDay: 25,
          },
        };

        await request(app)
          .put(`${usersEndpointRoute}/${fakeId}`)
          .send(updateData)
          .expect(404);
      });

      it('should handle empty update data', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const userId = await createTestUser(app);

        const response = await request(app)
          .put(`${usersEndpointRoute}/${userId}`)
          .send({})
          .expect(200);

        expect(response.body.id).toBe(userId);
        expect(response.body.preferences).toBeDefined();
      });
    });

    describe(`DELETE ${usersEndpointRoute}/:id`, () => {
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

      it('should delete a user successfully', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const userId = await createTestUser(app);

        await request(app)
          .delete(`${usersEndpointRoute}/${userId}`)
          .expect(204);

        await request(app).get(`${usersEndpointRoute}/${userId}`).expect(404);
      });

      it('should return 404 for non-existent user', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const fakeId = '60f7b1b3e1b3f00001234567';
        const response = await request(app)
          .delete(`${usersEndpointRoute}/${fakeId}`)
          .expect(500);

        expect(response.body).toHaveProperty('error');
      });

      it('should handle invalid user ID format', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const invalidId = 'invalid-id';
        const response = await request(app)
          .delete(`${usersEndpointRoute}/${invalidId}`)
          .expect(500);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Error handling', () => {
      it('should handle invalid preference values gracefully', async () => {
        await using testbed = await RestServerTestbed.create({
          intialPort: 4001,
        });
        const app = testbed.app;

        const userData = {
          preferences: {
            maxNewCardsPerDay: 'invalid',
            maxReviewsPerDay: -5,
            timezone: 123,
            defaultAlgorithm: 'invalid-algorithm',
          },
        };

        const response = await request(app)
          .post(usersEndpointRoute)
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.preferences).toBeDefined();
      });
    });
  });
});

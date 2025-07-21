import express, { Express } from 'express';
import request from 'supertest';
import { setupEndpoints } from '../endpoints';
import { registerProviders } from 'src/providers/providers-registration/providers-test';

describe('Health endpoint', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerProviders();
    setupEndpoints(app);
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should return consistent structure', async () => {
      const response1 = await request(app).get('/api/health').expect(200);
      const response2 = await request(app).get('/api/health').expect(200);

      // Both responses should have the same structure
      expect(Object.keys(response1.body)).toEqual(Object.keys(response2.body));

      // Status should always be 'ok'
      expect(response1.body.status).toBe('ok');
      expect(response2.body.status).toBe('ok');

      // Timestamp should be recent and different between calls
      const timestamp1 = new Date(response1.body.timestamp);
      const timestamp2 = new Date(response2.body.timestamp);
      expect(timestamp1).toBeInstanceOf(Date);
      expect(timestamp2).toBeInstanceOf(Date);
      expect(timestamp2.getTime()).toBeGreaterThanOrEqual(timestamp1.getTime());
    });

    it('should return valid timestamp format', async () => {
      const response = await request(app).get('/api/health').expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();

      // Should be a valid ISO string
      const date = new Date(timestamp);
      expect(date.toISOString()).toBe(timestamp);

      // Should be recent (within last 5 seconds)
      const now = new Date();
      const timeDiff = now.getTime() - date.getTime();
      expect(timeDiff).toBeLessThan(5000);
    });

    it('should return version information', async () => {
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version.length).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/api/health').expect(200),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('version');
      });
    });
  });

  describe('Content-Type and Headers', () => {
    it('should return JSON content type', async () => {
      const response = await request(app).get('/api/health').expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should not require authentication', async () => {
      // Health endpoint should be accessible without any authentication
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('HTTP Methods', () => {
    it('should only support GET method', async () => {
      await request(app).post('/api/health').expect(404);
      await request(app).put('/api/health').expect(404);
      await request(app).delete('/api/health').expect(404);
      await request(app).patch('/api/health').expect(404);
    });

    it('should handle HEAD requests', async () => {
      await request(app).head('/api/health').expect(200);
    });
  });

  describe('Error scenarios', () => {
    it('should handle malformed URL paths gracefully', async () => {
      await request(app).get('/api/health/extra').expect(404);
      // Note: Express treats /api/health/ the same as /api/health by default
      await request(app).get('/api/health/').expect(200);
    });

    it('should handle query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/health?param=value')
        .expect(200);

      // Should still return normal health response regardless of query params
      expect(response.body.status).toBe('ok');
    });
  });
});

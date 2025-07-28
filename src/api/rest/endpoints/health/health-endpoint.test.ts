import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { healthEndpointRoute } from './health';
import { RestApiTestbed } from '../../rest-server.utils.test';

describe('Health endpoint', () => {
  describe(`GET ${healthEndpointRoute}`, () => {
    it('should return health status', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should return consistent structure', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response1 = await request(app).get(healthEndpointRoute).expect(200);
      const response2 = await request(app).get(healthEndpointRoute).expect(200);

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
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

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
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version.length).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent requests', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const promises = Array.from({ length: 10 }, () =>
        request(app).get(healthEndpointRoute).expect(200),
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
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should not require authentication', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('HTTP Methods', () => {
    it('should only support GET method', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      await request(app).post(healthEndpointRoute).expect(404);
      await request(app).put(healthEndpointRoute).expect(404);
      await request(app).delete(healthEndpointRoute).expect(404);
      await request(app).patch(healthEndpointRoute).expect(404);
    });

    it('should handle HEAD requests', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      await request(app).head(healthEndpointRoute).expect(200);
    });
  });

  describe('Error scenarios', () => {
    it('should handle malformed URL paths gracefully', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      await request(app).get(`${healthEndpointRoute}/extra`).expect(404);
      await request(app).get(`${healthEndpointRoute}/`).expect(200);
    });

    it('should handle query parameters gracefully', async () => {
      using testbed = new RestApiTestbed();
      await testbed.waitForServer();
      const app = testbed.app;

      const response = await request(app)
        .get(`${healthEndpointRoute}?param=value`)
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });
});

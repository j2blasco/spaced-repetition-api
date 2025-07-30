import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { healthEndpointRoute } from './health';
import { RestServerTestbed } from '../../rest-server-testbed.utils.test';

describe('Health endpoint', () => {
  describe(`GET ${healthEndpointRoute}`, () => {
    it('should return health status', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should return consistent structure', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const response1 = await request(app).get(healthEndpointRoute).expect(200);
      const response2 = await request(app).get(healthEndpointRoute).expect(200);

      expect(Object.keys(response1.body)).toEqual(Object.keys(response2.body));

      expect(response1.body.status).toBe('ok');
      expect(response2.body.status).toBe('ok');

      const timestamp1 = new Date(response1.body.timestamp);
      const timestamp2 = new Date(response2.body.timestamp);
      expect(timestamp1).toBeInstanceOf(Date);
      expect(timestamp2).toBeInstanceOf(Date);
      expect(timestamp2.getTime()).toBeGreaterThanOrEqual(timestamp1.getTime());
    });

    it('should return valid timestamp format', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();

      const date = new Date(timestamp);
      expect(date.toISOString()).toBe(timestamp);

      const now = new Date();
      const timeDiff = now.getTime() - date.getTime();
      expect(timeDiff).toBeLessThan(5000);
    });

    it('should return version information', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version.length).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent requests', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
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
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should not require authentication', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const response = await request(app).get(healthEndpointRoute).expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('HTTP Methods', () => {
    it('should only support GET method', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      await request(app).post(healthEndpointRoute).expect(404);
      await request(app).put(healthEndpointRoute).expect(404);
      await request(app).delete(healthEndpointRoute).expect(404);
      await request(app).patch(healthEndpointRoute).expect(404);
    });

    it('should handle HEAD requests', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      await request(app).head(healthEndpointRoute).expect(200);
    });
  });

  describe('Error scenarios', () => {
    it('should handle malformed URL paths gracefully', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      await request(app).get(`${healthEndpointRoute}/extra`).expect(404);
      await request(app).get(`${healthEndpointRoute}/`).expect(200);
    });

    it('should handle query parameters gracefully', async () => {
      await using testbed = await RestServerTestbed.create({
        intialPort: 4001,
      });
      const app = testbed.app;

      const response = await request(app)
        .get(`${healthEndpointRoute}?param=value`)
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });
});

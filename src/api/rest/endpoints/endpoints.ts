import { Express } from 'express';
import { setupHealthEndpoint } from './health/health.js';

export function setupEndpoints(app: Express) {
  setupHealthEndpoint(app);
}

import { Express } from 'express';
import { setupHealthEndpoint } from './health/health';
import { setupUsersEndpoints } from './users/users';
import { setupCardsEndpoints } from './cards/cards-endpoint';
import { fullLogger } from '../middleware/logging-middleware';
import { restApiBaseRoute } from './endpoints-route';

export function setupEndpoints(app: Express) {
  // Add logging middleware to all API routes
  app.use(restApiBaseRoute, fullLogger);

  setupHealthEndpoint(app);
  setupUsersEndpoints(app);
  setupCardsEndpoints(app);
}

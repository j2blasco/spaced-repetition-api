import { Express } from 'express';
import { setupHealthEndpoint } from './health/health.js';
import { setupUsersEndpoints } from './users/users.js';
import { setupCardsEndpoints } from './cards/cards.js';

export function setupEndpoints(app: Express) {
  setupHealthEndpoint(app);
  setupUsersEndpoints(app);
  setupCardsEndpoints(app);
}

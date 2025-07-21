import { Express } from 'express';
import { setupHealthEndpoint } from './health/health';
import { setupUsersEndpoints } from './users/users';
import { setupCardsEndpoints } from './cards/cards';

export function setupEndpoints(app: Express) {
  setupHealthEndpoint(app);
  setupUsersEndpoints(app);
  setupCardsEndpoints(app);
}

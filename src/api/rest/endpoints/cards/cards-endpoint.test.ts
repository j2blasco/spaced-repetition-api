import express from 'express';
import request from 'supertest';
import { setupEndpoints } from '../endpoints';
import { registerProviders } from 'src/providers/providers-registration/providers-test';

describe('Card endpoints', () => {
  // TODO
  it('test', () => {
    const app = express();
    registerProviders();
    setupEndpoints(app);
  });
});

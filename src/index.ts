import { initModuleAlias } from './module-alias';
initModuleAlias();

import express from 'express';
import { startRestApiServer } from './api/rest/rest-server';
import { useCorsMiddleware } from './api/rest/utils/cors/cors-middleware';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 4001;

useCorsMiddleware(app);

startRestApiServer({
  app,
  port,
  logGreeting: true,
});

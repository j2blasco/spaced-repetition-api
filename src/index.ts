// TODO: probably we don't need module alias if we use tsup and tsx
import { initModuleAlias } from './module-alias';
initModuleAlias();

import express from 'express';
import { startRestApiServer } from './api/rest/rest-server';
import { useCorsMiddleware } from './api/rest/utils/cors/cors-middleware';
import { registerProviders } from './providers/providers';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 4001;

useCorsMiddleware(app);

registerProviders(process.env.ENV_TYPE ?? 'alpha');

startRestApiServer({
  app,
  port,
  logGreeting: true,
});

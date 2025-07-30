import express from 'express';
import { startRestApiServer } from './api/rest/rest-server';
import { useCorsMiddleware } from './api/rest/utils/cors/cors-middleware';
import { registerProviders } from './providers/providers-registration/providers';

export async function startServer(args: {
  envType: string;
  port: number;
  logGreeting: boolean;
}) {
  const { envType, port, logGreeting } = args;

  const app = express();

  useCorsMiddleware(app);

  registerProviders(envType);

  const server = await startRestApiServer({
    app,
    port,
    logGreeting,
  });

  return {
    app,
    server,
  };
}

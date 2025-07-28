import express, { Express } from 'express';
import { Server } from 'http';
import { setupEndpoints } from './endpoints/endpoints';
import { restApiBaseRoute } from './endpoints/endpoints-route';

export async function startRestApiServer(args: {
  app: Express;
  port: number;
  logGreeting?: boolean;
}): Promise<Server> {
  const { app, port } = args;

  app.use(restApiBaseRoute, express.json());

  setupEndpoints(app);

  const server = app.listen(port, () => {
    if (args.logGreeting) {
      console.log(`🚀 Rest api server ready at http://localhost:${port}/rest`);
    }
  });

  return server;
}

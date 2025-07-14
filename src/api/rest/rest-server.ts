import express, { Express } from 'express';
import { setupEndpoints } from './endpoints/endpoints';

export async function startRestApiServer(args: {
  app: Express;
  port: number;
  logGreeting?: boolean;
}) {
  const { app, port } = args;

  app.use(`/rest`, express.json());

  setupEndpoints(app);

  app.listen(port, () => {
    if (args.logGreeting) {
      console.log(`🚀 Rest api server ready at http://localhost:${port}/rest`);
    }
  });
}

import { Express, Request, Response } from 'express';

export function setupHealthEndpoint(app: Express) {
  app.get('/rest/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'spaced-repetition-api',
    });
  });
}

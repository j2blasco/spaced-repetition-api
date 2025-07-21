import { Express, Request, Response } from 'express';

export const healthEndpointRoute = '/rest/health';

function handleHealthEndpoint(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'spaced-repetition-api',
  });
}

export function setupHealthEndpoint(app: Express) {
  app.get(healthEndpointRoute, (req: Request, res: Response) => {
    try {
      handleHealthEndpoint(req, res);
    } catch (error) {
      console.error(`Error in ${healthEndpointRoute}`, error);
    }
  });
}

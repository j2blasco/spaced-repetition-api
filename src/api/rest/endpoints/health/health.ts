import { Express, Request, Response } from 'express';

export const healthEndpointRoute = '/api/health';

function handleHealthEndpoint(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
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

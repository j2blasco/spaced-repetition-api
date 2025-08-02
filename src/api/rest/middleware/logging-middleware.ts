import { Request, Response, NextFunction } from 'express';

interface LoggingOptions {
  logRequests?: boolean;
  logResponses?: boolean;
  logBodies?: boolean;
  logHeaders?: boolean;
}

interface RequestLog {
  timestamp: string;
  type: 'REQUEST';
  method: string;
  url: string;
  ip: string | undefined;
  body?: unknown;
  query?: unknown;
  params?: unknown;
  headers?: unknown;
}

interface ResponseLog {
  timestamp: string;
  type: 'RESPONSE';
  method: string;
  url: string;
  statusCode: number;
  duration: string;
  responseMethod: string;
  body?: unknown;
  headers?: unknown;
}

const defaultOptions: LoggingOptions = {
  logRequests: true,
  logResponses: true,
  logBodies: true,
  logHeaders: false,
};

export function createLoggingMiddleware(options: LoggingOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // Log incoming request
    if (config.logRequests) {
      const requestLog: RequestLog = {
        timestamp,
        type: 'REQUEST',
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
      };

      if (config.logBodies && Object.keys(req.body || {}).length > 0) {
        requestLog.body = req.body;
      }

      if (config.logBodies && Object.keys(req.query || {}).length > 0) {
        requestLog.query = req.query;
      }

      if (config.logBodies && Object.keys(req.params || {}).length > 0) {
        requestLog.params = req.params;
      }

      if (config.logHeaders) {
        requestLog.headers = req.headers;
      }

      console.log('🚀 API Request:', JSON.stringify(requestLog, null, 2));
    }

    // Intercept response to log it
    if (config.logResponses) {
      const originalSend = res.send;
      const originalJson = res.json;
      let responseLogged = false; // Flag to ensure we only log once

      res.send = function (body) {
        if (!responseLogged) {
          logResponse(body, 'send');
          responseLogged = true;
        }
        return originalSend.call(this, body);
      };

      res.json = function (body) {
        if (!responseLogged) {
          logResponse(body, 'json');
          responseLogged = true;
        }
        return originalJson.call(this, body);
      };

      function logResponse(body: unknown, method: string) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const responseLog: ResponseLog = {
          timestamp: new Date().toISOString(),
          type: 'RESPONSE',
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          responseMethod: method,
        };

        if (config.logBodies && body !== undefined) {
          try {
            responseLog.body =
              typeof body === 'string' ? JSON.parse(body) : body;
          } catch {
            responseLog.body = body;
          }
        }

        if (config.logHeaders) {
          responseLog.headers = res.getHeaders();
        }

        const emoji = res.statusCode >= 400 ? '❌' : '✅';
        console.log(
          `${emoji} API Response:`,
          JSON.stringify(responseLog, null, 2),
        );
      }
    }

    next();
  };
}

// Pre-configured middleware instances
export const requestLogger = createLoggingMiddleware({
  logRequests: true,
  logResponses: false,
  logBodies: true,
  logHeaders: false,
});

export const responseLogger = createLoggingMiddleware({
  logRequests: false,
  logResponses: true,
  logBodies: true,
  logHeaders: false,
});

export const fullLogger = createLoggingMiddleware({
  logRequests: true,
  logResponses: true,
  logBodies: true,
  logHeaders: false,
});

export const minimalLogger = createLoggingMiddleware({
  logRequests: true,
  logResponses: true,
  logBodies: false,
  logHeaders: false,
});

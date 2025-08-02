# API Logging Middleware

This project includes a comprehensive logging middleware that captures all API requests and responses for monitoring and debugging purposes.

## Features

- **Request Logging**: Captures method, URL, IP address, query parameters, route parameters, and request body
- **Response Logging**: Captures status code, response body, and request duration
- **Configurable**: Multiple pre-configured options for different logging levels
- **TypeScript Support**: Fully typed for better developer experience

## Usage

The logging middleware is automatically applied to all REST API endpoints in `src/api/rest/endpoints/endpoints.ts`:

```typescript
import { fullLogger } from '../middleware/logging-middleware';

export function setupEndpoints(app: Express) {
  // Add logging middleware to all API routes
  app.use(restApiBaseRoute, fullLogger);
  
  setupHealthEndpoint(app);
  setupUsersEndpoints(app);
  setupCardsEndpoints(app);
}
```

## Pre-configured Middleware Options

### `fullLogger` (Default)
Logs both requests and responses with body content:
- ✅ Request logging
- ✅ Response logging  
- ✅ Body/query/params logging
- ❌ Headers logging

### `requestLogger`
Only logs incoming requests:
- ✅ Request logging
- ❌ Response logging
- ✅ Body/query/params logging
- ❌ Headers logging

### `responseLogger`
Only logs outgoing responses:
- ❌ Request logging
- ✅ Response logging
- ✅ Body logging
- ❌ Headers logging

### `minimalLogger`
Logs requests and responses without body content:
- ✅ Request logging
- ✅ Response logging
- ❌ Body/query/params logging
- ❌ Headers logging

## Custom Configuration

You can create a custom logging middleware with specific options:

```typescript
import { createLoggingMiddleware } from '../middleware/logging-middleware';

const customLogger = createLoggingMiddleware({
  logRequests: true,
  logResponses: true,
  logBodies: false,     // Skip body logging for performance
  logHeaders: true,     // Include headers for debugging
});

app.use('/api/rest', customLogger);
```

## Log Format

### Request Log Example
```json
{
  "timestamp": "2025-08-02T12:02:24.581Z",
  "type": "REQUEST",
  "method": "POST",
  "url": "/api/rest/users",
  "ip": "::1",
  "body": {
    "preferences": {}
  }
}
```

### Response Log Example
```json
{
  "timestamp": "2025-08-02T12:02:24.584Z",
  "type": "RESPONSE",
  "method": "POST",
  "url": "/api/rest/users",
  "statusCode": 201,
  "duration": "3ms",
  "responseMethod": "json",
  "body": {
    "id": "b7b6ed12-0e30-4194-95c8-84df2413b184",
    "preferences": {
      "maxNewCardsPerDay": 20,
      "maxReviewsPerDay": 100,
      "defaultAlgorithm": "sm2",
      "timezone": "UTC"
    },
    "createdAt": "2025-08-02T12:02:24.582Z",
    "updatedAt": "2025-08-02T12:02:24.582Z"
  }
}
```

## Performance Considerations

- Body logging can impact performance for large payloads
- Use `minimalLogger` in production for high-traffic applications
- Consider implementing log levels or conditional logging based on environment
- Headers logging should be used sparingly as it can expose sensitive information

## Security Notes

- Request/response bodies may contain sensitive information
- Consider filtering sensitive fields in production
- Headers logging can expose authentication tokens and other sensitive data
- Ensure logs are properly secured and access-controlled

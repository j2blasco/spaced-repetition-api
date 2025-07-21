# Spaced Repetition API Architecture

## Overview

This document describes the REST API architecture for a spaced repetition service similar to Anki. The service enables users to create, study, and manage flashcards using scientifically-proven spaced repetition algorithms to optimize learning and retention.

## Core Concepts

### 1. User
- Represents a registered user of the system
- Has preferences for daily study limits and algorithm choice
- Can own multiple cards organized by tags

### 2. Card
- The fundamental unit of study containing question/answer data
- Belongs to a user and can be organized using tags
- Has associated scheduling data for spaced repetition
- Contains custom data fields for flexible content

### 3. Review
- Records user response to a card (again, hard, good, easy)
- Updates card's next review date using spaced repetition algorithm
- Tracks performance metrics and timing

## Data Models

### User
```json
{
  "id": "string (UUID)",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "preferences": {
    "maxNewCardsPerDay": "number",
    "maxReviewsPerDay": "number",
    "timezone": "string",
    "defaultAlgorithm": "sm2|fsrs"
  }
}
```

### Card
```json
{
  "id": "string (UUID)",
  "userId": "string (UUID)",
  "tags": ["string"],
  "data": "object (any JSON structure for card content)",
  "scheduling": {
    "algorithmType": "sm2|fsrs",
    "nextReviewDate": "datetime",
    "algorithmData": "object (algorithm-specific parameters)"
  },
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Review
```json
{
  "id": "string (UUID)",
  "cardId": "string (UUID)",
  "userId": "string (UUID)",
  "response": "again|hard|good|easy"
}
```

## API Endpoints

### Users
```
POST   /api/users                    # Create new user
GET    /api/users/{id}               # Get user details
PUT    /api/users/{id}               # Update user preferences
DELETE /api/users/{id}               # Delete user
```

### Cards
```
GET    /api/cards                    # List user's cards (with filtering by tags, due status)
POST   /api/cards                    # Create new card
GET    /api/cards/{id}               # Get card details
PUT    /api/cards/{id}               # Update card content
DELETE /api/cards/{id}               # Delete card
GET    /api/cards/due                # Get cards due for review
POST   /api/cards/{id}/review        # Submit card review (updates scheduling)
```

## Spaced Repetition Algorithm

The API supports multiple spaced repetition algorithms internally, with SM-2 as the default. Algorithm selection is configured per user in their preferences.

### Currently Supported Algorithms

#### SM-2 (SuperMemo 2) - Default
The classic algorithm used by Anki and many other SRS systems.

**Parameters:**
- **Interval**: Days until next review
- **Repetitions**: Number of successful reviews
- **Ease Factor**: Multiplier affecting interval growth (1.3 - 2.5)

**Algorithm Flow:**
1. New cards start with 1-day interval
2. Successful reviews increase interval based on ease factor
3. Failed reviews reset to learning phase
4. Ease factor adjusts based on response difficulty

### Response Grades
- **Again (1)**: Complete failure, restart learning
- **Hard (2)**: Difficult recall, reduce ease factor
- **Good (3)**: Correct with effort, normal progression
- **Easy (4)**: Perfect recall, bonus interval

## Error Handling

### Standard HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate resources)
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Security Considerations

### Authentication
- JWT tokens for API authentication
- Refresh token rotation
- Password hashing with bcrypt
- Rate limiting on authentication endpoints

### Authorization
- Users can only access their own data
- Deck sharing permissions
- Admin roles for system management

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection for card content
- CORS configuration for web clients

## Performance Optimizations

### Caching
- Redis for session data
- Card scheduling cache
- Statistics aggregation cache

### Database
- Indexes on frequently queried fields
- Pagination for large datasets
- Connection pooling
- Read replicas for statistics

### API Design
- Efficient filtering and sorting
- Bulk operations for card creation
- Lazy loading of related data
- Compression for large responses

## Integration Points

### Import/Export
- Anki deck format support (.apkg)
- CSV import/export
- JSON backup format

### External Services
- Image/audio file storage (AWS S3)
- Email notifications
- Analytics tracking
- Text-to-speech integration

## Future Enhancements

### Advanced Features
- Collaborative decks
- Real-time multiplayer study sessions
- AI-powered card generation
- Adaptive difficulty adjustment
- Learning analytics dashboard

### Mobile Support
- Offline synchronization
- Push notifications for study reminders
- Mobile-optimized endpoints
- Background sync capabilities

## Deployment Architecture

### Infrastructure
- Containerized application (Docker)
- Load balancer for high availability
- Database clustering
- CDN for static assets

### Monitoring
- Application performance monitoring
- Error tracking and alerting
- User analytics
- System health checks

This architecture provides a solid foundation for building a comprehensive spaced repetition service that can scale with user growth while maintaining the core learning effectiveness that makes systems like Anki so successful.

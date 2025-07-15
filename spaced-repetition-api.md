# Spaced Repetition API Architecture

## Overview

This document describes the REST API architecture for a spaced repetition service similar to Anki. The service enables users to create, study, and manage flashcards using scientifically-proven spaced repetition algorithms to optimize learning and retention.

## Core Concepts

### 1. User
- Represents a registered user of the system
- Has authentication credentials and profile information
- Can own multiple decks

### 2. Deck
- A collection of cards organized by topic or subject
- Can be shared between users or kept private
- Contains metadata like name, description, tags, and creation date

### 3. Card
- The fundamental unit of study containing a question and answer
- Belongs to a deck
- Has associated scheduling data for spaced repetition
- Supports multiple card types (basic, cloze, reverse, etc.)

### 4. Note
- The raw content that generates one or more cards
- Contains fields that map to card templates
- Allows for flexible card generation from structured data

### 5. Review
- Records user response to a card (again, hard, good, easy)
- Updates card's next review date using spaced repetition algorithm
- Tracks performance metrics and timing

## Data Models

### User
```json
{
  "id": "string (UUID)",
  "username": "string",
  "email": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "preferences": {
    "dailyNewCards": "number",
    "maxReviews": "number",
    "timezone": "string",
    "defaultAlgorithm": "sm2|sm4|fsrs"
  }
}
```

### Deck
```json
{
  "id": "string (UUID)",
  "userId": "string (UUID)",
  "name": "string",
  "description": "string",
  "tags": ["string"],
  "isPublic": "boolean",
  "defaultAlgorithm": "sm2|sm4|fsrs",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "cardCount": "number",
  "newCardsToday": "number",
  "reviewsToday": "number"
}
```

### Note
```json
{
  "id": "string (UUID)",
  "deckId": "string (UUID)",
  "fields": {
    "front": "string (HTML/Markdown)",
    "back": "string (HTML/Markdown)",
    "extra": "string (HTML/Markdown)"
  },
  "tags": ["string"],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Card
```json
{
  "id": "string (UUID)",
  "noteId": "string (UUID)",
  "deckId": "string (UUID)",
  "cardType": "basic|reverse|cloze",
  "front": "string (HTML/Markdown)",
  "back": "string (HTML/Markdown)",
  "scheduling": {
    "algorithm": "sm2|sm4|fsrs",
    "interval": "number (days)",
    "repetitions": "number",
    "easeFactor": "number (1.3-2.5)",
    "nextReviewDate": "datetime",
    "lastReviewDate": "datetime",
    "cardState": "new|learning|review|relearning",
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
  "response": "again|hard|good|easy",
  "responseTime": "number (seconds)",
  "reviewedAt": "datetime",
  "previousInterval": "number",
  "newInterval": "number"
}
```

## API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
```

### Decks
```
GET    /api/decks                    # List user's decks
POST   /api/decks                    # Create new deck
GET    /api/decks/{id}               # Get deck details
PUT    /api/decks/{id}               # Update deck
DELETE /api/decks/{id}               # Delete deck
GET    /api/decks/public             # Browse public decks
POST   /api/decks/{id}/clone         # Clone a public deck
```

### Notes
```
GET    /api/decks/{deckId}/notes     # List notes in deck
POST   /api/decks/{deckId}/notes     # Create new note
GET    /api/notes/{id}               # Get note details
PUT    /api/notes/{id}               # Update note
DELETE /api/notes/{id}               # Delete note
```

### Cards
```
GET    /api/decks/{deckId}/cards     # List cards in deck
GET    /api/cards/{id}               # Get card details
PUT    /api/cards/{id}               # Update card (manual scheduling)
DELETE /api/cards/{id}               # Delete card
GET    /api/cards/due                # Get cards due for review
POST   /api/cards/{id}/review        # Submit card review (updates scheduling)
```

## Spaced Repetition Algorithm

The API supports multiple spaced repetition algorithms internally, with SM-2 as the default. While the system is designed to handle different algorithms (SM-2, SM-4, FSRS), algorithm selection and switching are not exposed through API endpoints in the current version.

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

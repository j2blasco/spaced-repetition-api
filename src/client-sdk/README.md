# Spaced Repetition Client SDK

A TypeScript/JavaScript client library for the Spaced Repetition API that provides an easy-to-use interface for frontend applications.

## Installation

```bash
# If published to npm (future)
npm install spaced-repetition-client

# For now, copy the files to your project
cp src/client-sdk/* your-project/src/lib/
```

## Quick Start

```typescript
import SpacedRepetitionClient from './client-sdk';

// Initialize the client
const client = new SpacedRepetitionClient({
  baseUrl: 'http://localhost:4001', // Your API server URL
  timeout: 10000, // Request timeout in ms
});

// Create a user
const user = await client.createUser({
  preferences: {
    maxNewCardsPerDay: 20,
    maxReviewsPerDay: 100,
    timezone: 'UTC',
  },
});

// Create a flashcard
const card = await client.createCard({
  userId: user.id,
  tags: ['spanish', 'vocabulary'],
  data: { front: 'Hello', back: 'Hola' },
  algorithmType: 'sm2',
});

// Start a study session
const session = await client.createStudySession(user.id, {
  tags: ['spanish'],
  limit: 10,
});

// Review cards
const result = await client.reviewCard(card.id, {
  response: 'good', // 'failed' | 'good' | 'easy'
  reviewedAt: new Date().toISOString(),
});
```

## API Reference

### Client Configuration

```typescript
interface ClientConfig {
  baseUrl?: string;    // Default: 'http://localhost:4001'
  timeout?: number;    // Default: 10000 (10 seconds)
}
```

### User Management

#### `createUser(request: CreateUserRequest): Promise<User>`
Creates a new user with optional preferences.

#### `getUser(userId: string): Promise<User>`
Retrieves user information by ID.

#### `updateUser(userId: string, request: UpdateUserRequest): Promise<User>`
Updates user preferences.

#### `deleteUser(userId: string): Promise<void>`
Deletes a user account.

### Card Management

#### `createCard(request: CreateCardRequest): Promise<Card>`
Creates a new flashcard.

```typescript
const card = await client.createCard({
  userId: 'user-id',
  tags: ['spanish', 'vocabulary'],
  data: { 
    front: 'Hello', 
    back: 'Hola',
    example: 'Hello, how are you?' 
  },
  algorithmType: 'sm2', // Optional, defaults to 'sm2'
});
```

#### `getCard(cardId: string): Promise<Card>`
Retrieves a specific card by ID.

#### `getUserCards(userId: string): Promise<Card[]>`
Gets all cards for a user.

#### `updateCard(cardId: string, request: UpdateCardRequest): Promise<Card>`
Updates card content or tags.

#### `deleteCard(cardId: string): Promise<void>`
Deletes a card.

#### `getDueCards(query: DueCardsQuery): Promise<Card[]>`
Gets cards that are due for review.

```typescript
const dueCards = await client.getDueCards({
  userId: 'user-id',
  tags: ['spanish'], // Optional: filter by tags
  limit: 20,         // Optional: limit number of cards
  currentDate: new Date().toISOString(), // Optional: specify date
});
```

### Review System

#### `reviewCard(cardId: string, request: ReviewCardRequest): Promise<ReviewCardResponse>`
Submits a review for a card and updates its scheduling.

```typescript
const result = await client.reviewCard('card-id', {
  response: 'good',    // 'failed' | 'good' | 'easy'
  reviewedAt: new Date().toISOString(), // Optional
});

console.log('Next review:', result.newScheduling.nextReviewDate);
```

### Utility Methods

#### `createStudySession(userId: string, options?): Promise<StudySession>`
Creates a complete study session with due cards.

```typescript
const session = await client.createStudySession('user-id', {
  tags: ['spanish', 'vocabulary'], // Optional
  limit: 10,                       // Optional
  currentDate: new Date(),         // Optional
});

console.log(`${session.dueCards.length} cards due`);
```

#### `batchReviewCards(reviews: ReviewRequest[]): Promise<ReviewCardResponse[]>`
Reviews multiple cards in a single operation.

```typescript
const results = await client.batchReviewCards([
  { cardId: 'card-1', response: 'good' },
  { cardId: 'card-2', response: 'easy' },
  { cardId: 'card-3', response: 'failed' },
]);
```

#### `getStudyStats(userId: string, options?): Promise<StudyStats>`
Gets study statistics for a user.

```typescript
const stats = await client.getStudyStats('user-id', {
  tags: ['spanish'], // Optional
  currentDate: new Date(), // Optional
});

console.log(`Total: ${stats.totalCards}, Due: ${stats.dueCards}, Today: ${stats.dueToday}`);
```

## Response Types

### Review Responses
- `'failed'` - User couldn't recall the answer
- `'good'` - User recalled with some effort  
- `'easy'` - User recalled effortlessly

### Card Data Structure
Cards support flexible data structures:

```typescript
// Basic flashcard
{ front: 'Question', back: 'Answer' }

// With example
{ front: 'Word', back: 'Translation', example: 'Usage example' }

// Multiple choice
{ 
  question: 'What is 2+2?', 
  options: ['3', '4', '5'], 
  correct: 1 
}

// Image-based
{ 
  image: 'https://example.com/image.jpg', 
  answer: 'Description' 
}
```

## Error Handling

The client throws descriptive errors that you should handle:

```typescript
try {
  const card = await client.getCard('invalid-id');
} catch (error) {
  if (error.message.includes('404')) {
    console.log('Card not found');
  } else if (error.message.includes('timeout')) {
    console.log('Request timed out');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## Advanced Usage

### Custom Retry Logic

```typescript
async function withRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const card = await withRetry(() => client.getCard('card-id'));
```

### Progress Tracking

```typescript
async function studyWithProgress(userId: string) {
  const session = await client.createStudySession(userId);
  let completed = 0;
  
  for (const card of session.dueCards) {
    // Present card to user...
    const response = getUserResponse(); // Your UI logic
    
    await client.reviewCard(card.id, { response });
    completed++;
    
    console.log(`Progress: ${completed}/${session.dueCards.length}`);
  }
}
```

## Development

To run the example:

```bash
npm run build
node dist/client-sdk/example.js
```

## License

MIT

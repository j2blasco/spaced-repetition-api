import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import SpacedRepetitionClient, {
  CreateUserRequest,
  UpdateUserRequest,
  CreateCardRequest,
  UpdateCardRequest,
  DueCardsQuery,
  ReviewCardRequest,
} from '../../client-sdk/index';

const server = new McpServer({
  name: 'spaced-repetition-server',
  version: '1.0.0',
});

// Initialize the client with default configuration
const client = new SpacedRepetitionClient({
  baseUrl: process.env.SPACED_REPETITION_API_URL || 'http://localhost:4001',
  timeout: 10000,
});

// User Management Tools
server.registerTool(
  'create_user',
  {
    title: 'Create User',
    description: 'Create a new user with preferences',
    inputSchema: {
      preferences: z
        .object({
          maxNewCardsPerDay: z.number().optional(),
          maxReviewsPerDay: z.number().optional(),
          timezone: z.string().optional(),
          defaultAlgorithm: z.string().optional(),
        })
        .optional(),
    },
  },
  async ({ preferences }) => {
    try {
      const request: CreateUserRequest = { preferences };
      const user = await client.createUser(request);
      return {
        content: [
          {
            type: 'text',
            text: `User created successfully:\nID: ${user.id}\nCreated: ${user.createdAt}\nPreferences: ${JSON.stringify(user.preferences, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating user: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'get_user',
  {
    title: 'Get User',
    description: 'Retrieve a user by ID',
    inputSchema: {
      userId: z.string(),
    },
  },
  async ({ userId }) => {
    try {
      const user = await client.getUser(userId);
      return {
        content: [
          {
            type: 'text',
            text: `User Details:\nID: ${user.id}\nCreated: ${user.createdAt}\nUpdated: ${user.updatedAt}\nPreferences: ${JSON.stringify(user.preferences, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving user: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'update_user',
  {
    title: 'Update User',
    description: 'Update user preferences',
    inputSchema: {
      userId: z.string(),
      preferences: z
        .object({
          maxNewCardsPerDay: z.number().optional(),
          maxReviewsPerDay: z.number().optional(),
          timezone: z.string().optional(),
          defaultAlgorithm: z.string().optional(),
        })
        .optional(),
    },
  },
  async ({ userId, preferences }) => {
    try {
      const request: UpdateUserRequest = { preferences };
      const user = await client.updateUser(userId, request);
      return {
        content: [
          {
            type: 'text',
            text: `User updated successfully:\nID: ${user.id}\nUpdated: ${user.updatedAt}\nPreferences: ${JSON.stringify(user.preferences, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating user: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'delete_user',
  {
    title: 'Delete User',
    description: 'Delete a user by ID',
    inputSchema: {
      userId: z.string(),
    },
  },
  async ({ userId }) => {
    try {
      await client.deleteUser(userId);
      return {
        content: [
          {
            type: 'text',
            text: `User ${userId} deleted successfully`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error deleting user: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Card Management Tools
server.registerTool(
  'create_card',
  {
    title: 'Create Card',
    description: 'Create a new flashcard for a user',
    inputSchema: {
      userId: z.string(),
      data: z.record(z.unknown()),
      tags: z.array(z.string()).optional(),
      algorithmType: z.string().optional(),
    },
  },
  async ({ userId, data, tags, algorithmType }) => {
    try {
      const request: CreateCardRequest = {
        userId,
        data,
        tags,
        algorithmType,
      };
      const card = await client.createCard(request);
      return {
        content: [
          {
            type: 'text',
            text: `Card created successfully:\nID: ${card.id}\nUser ID: ${card.userId}\nTags: ${card.tags.join(', ')}\nNext Review: ${card.scheduling.nextReviewDate}\nData: ${JSON.stringify(card.data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating card: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'get_card',
  {
    title: 'Get Card',
    description: 'Retrieve a card by ID',
    inputSchema: {
      cardId: z.string(),
    },
  },
  async ({ cardId }) => {
    try {
      const card = await client.getCard(cardId);
      return {
        content: [
          {
            type: 'text',
            text: `Card Details:\nID: ${card.id}\nUser ID: ${card.userId}\nTags: ${card.tags.join(', ')}\nNext Review: ${card.scheduling.nextReviewDate}\nAlgorithm: ${card.scheduling.algorithmType}\nCreated: ${card.createdAt}\nUpdated: ${card.updatedAt}\nData: ${JSON.stringify(card.data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving card: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'get_user_cards',
  {
    title: 'Get User Cards',
    description: 'Retrieve all cards for a user',
    inputSchema: {
      userId: z.string(),
    },
  },
  async ({ userId }) => {
    try {
      const cards = await client.getUserCards(userId);
      const cardList = cards
        .map(
          (card) =>
            `- ${card.id}: ${card.tags.join(', ')} (Next: ${card.scheduling.nextReviewDate})`,
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `User ${userId} has ${cards.length} cards:\n${cardList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving user cards: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'get_due_cards',
  {
    title: 'Get Due Cards',
    description: 'Get cards that are due for review',
    inputSchema: {
      userId: z.string(),
      tags: z.array(z.string()).optional(),
      limit: z.number().optional(),
      currentDate: z.string().optional(),
    },
  },
  async ({ userId, tags, limit, currentDate }) => {
    try {
      const query: DueCardsQuery = {
        userId,
        tags,
        limit,
        currentDate,
      };
      const cards = await client.getDueCards(query);
      const cardList = cards
        .map(
          (card) =>
            `- ${card.id}: ${card.tags.join(', ')} (Due: ${card.scheduling.nextReviewDate})`,
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${cards.length} due cards:\n${cardList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving due cards: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'review_card',
  {
    title: 'Review Card',
    description: 'Submit a review response for a card',
    inputSchema: {
      cardId: z.string(),
      response: z.enum(['failed', 'good', 'easy']),
      reviewedAt: z.string().optional(),
    },
  },
  async ({ cardId, response, reviewedAt }) => {
    try {
      const request: ReviewCardRequest = {
        response,
        reviewedAt,
      };
      const result = await client.reviewCard(cardId, request);
      return {
        content: [
          {
            type: 'text',
            text: `Card reviewed successfully:\nCard ID: ${result.cardId}\nResponse: ${result.reviewResponse}\nReviewed At: ${result.reviewedAt}\nNext Review: ${result.newScheduling.nextReviewDate}\nAlgorithm: ${result.newScheduling.algorithmType}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reviewing card: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'update_card',
  {
    title: 'Update Card',
    description: "Update a card's data or tags",
    inputSchema: {
      cardId: z.string(),
      data: z.record(z.unknown()).optional(),
      tags: z.array(z.string()).optional(),
    },
  },
  async ({ cardId, data, tags }) => {
    try {
      const request: UpdateCardRequest = { data, tags };
      const card = await client.updateCard(cardId, request);
      return {
        content: [
          {
            type: 'text',
            text: `Card updated successfully:\nID: ${card.id}\nTags: ${card.tags.join(', ')}\nUpdated: ${card.updatedAt}\nData: ${JSON.stringify(card.data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating card: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'delete_card',
  {
    title: 'Delete Card',
    description: 'Delete a card by ID',
    inputSchema: {
      cardId: z.string(),
    },
  },
  async ({ cardId }) => {
    try {
      await client.deleteCard(cardId);
      return {
        content: [
          {
            type: 'text',
            text: `Card ${cardId} deleted successfully`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error deleting card: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Study Session Tools
server.registerTool(
  'create_study_session',
  {
    title: 'Create Study Session',
    description: 'Create a complete study session with due cards',
    inputSchema: {
      userId: z.string(),
      tags: z.array(z.string()).optional(),
      limit: z.number().optional(),
    },
  },
  async ({ userId, tags, limit }) => {
    try {
      const session = await client.createStudySession(userId, { tags, limit });
      const cardList = session.dueCards
        .map(
          (card) =>
            `- ${card.id}: ${card.tags.join(', ')} (Due: ${card.scheduling.nextReviewDate})`,
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Study session created:\nTotal due cards: ${session.totalDue}\nCards in session:\n${cardList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating study session: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  'get_study_stats',
  {
    title: 'Get Study Stats',
    description: 'Get study statistics for a user',
    inputSchema: {
      userId: z.string(),
      tags: z.array(z.string()).optional(),
    },
  },
  async ({ userId, tags }) => {
    try {
      const stats = await client.getStudyStats(userId, { tags });
      return {
        content: [
          {
            type: 'text',
            text: `Study Statistics for User ${userId}:\nTotal Cards: ${stats.totalCards}\nDue Cards: ${stats.dueCards}\nDue Today: ${stats.dueToday}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving study stats: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Health Check Tool
server.registerTool(
  'health_check',
  {
    title: 'Health Check',
    description: 'Check if the API is healthy',
    inputSchema: {},
  },
  async () => {
    try {
      const health = await client.healthCheck();
      return {
        content: [
          {
            type: 'text',
            text: `API Health: ${health.status}\nTimestamp: ${health.timestamp}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `API is unhealthy: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Resources for dynamic data access
server.registerResource(
  'user',
  new ResourceTemplate('spaced-repetition://user/{userId}', {
    list: undefined,
  }),
  {
    title: 'User Resource',
    description: 'Access user information',
  },
  async (uri, { userId }) => {
    try {
      const userIdStr = Array.isArray(userId) ? userId[0] : userId;
      const user = await client.getUser(userIdStr);
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(user, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: 'text/plain',
          },
        ],
      };
    }
  },
);

server.registerResource(
  'card',
  new ResourceTemplate('spaced-repetition://card/{cardId}', {
    list: undefined,
  }),
  {
    title: 'Card Resource',
    description: 'Access card information',
  },
  async (uri, { cardId }) => {
    try {
      const cardIdStr = Array.isArray(cardId) ? cardId[0] : cardId;
      const card = await client.getCard(cardIdStr);
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(card, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: 'text/plain',
          },
        ],
      };
    }
  },
);

server.registerResource(
  'due-cards',
  new ResourceTemplate('spaced-repetition://due-cards/{userId}', {
    list: undefined,
  }),
  {
    title: 'Due Cards Resource',
    description: 'Access due cards for a user',
  },
  async (uri, { userId }) => {
    try {
      const userIdStr = Array.isArray(userId) ? userId[0] : userId;
      const cards = await client.getDueCards({ userId: userIdStr });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(cards, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: 'text/plain',
          },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

import { usersEndpointRoute } from '../api/rest/endpoints/users/users';
import { cardsEndpointRoute } from '../api/rest/endpoints/cards/cards-endpoint';
import { healthEndpointRoute } from '../api/rest/endpoints/health/health';

export interface ClientConfig {
  baseUrl?: string;
  timeout?: number;
}

export interface User {
  id: string;
  preferences: {
    maxNewCardsPerDay?: number;
    maxReviewsPerDay?: number;
    timezone?: string;
    defaultAlgorithm?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  userId: string;
  tags: string[];
  data: Record<string, unknown>;
  scheduling: {
    algorithmType: string;
    nextReviewDate: string;
    algorithmData: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  preferences?: {
    maxNewCardsPerDay?: number;
    maxReviewsPerDay?: number;
    timezone?: string;
    defaultAlgorithm?: string;
  };
}

export interface UpdateUserRequest {
  preferences?: {
    maxNewCardsPerDay?: number;
    maxReviewsPerDay?: number;
    timezone?: string;
    defaultAlgorithm?: string;
  };
}

export interface CreateCardRequest {
  userId: string;
  tags?: string[];
  data: Record<string, unknown>;
  algorithmType?: string;
}

export interface UpdateCardRequest {
  tags?: string[];
  data?: Record<string, unknown>;
}

export interface DueCardsQuery {
  userId: string;
  tags?: string[];
  limit?: number;
  currentDate?: string;
}

export interface ReviewCardRequest {
  response: 'failed' | 'good' | 'easy';
  reviewedAt?: string;
}

export interface ReviewCardResponse {
  cardId: string;
  reviewResponse: string;
  reviewedAt: string;
  newScheduling: {
    algorithmType: string;
    nextReviewDate: string;
    algorithmData: Record<string, unknown>;
  };
  updatedCard: Card;
}

export class SpacedRepetitionClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:4001';
    this.timeout = config.timeout || 10000;
  }

  // User Management
  async createUser(request: CreateUserRequest): Promise<User> {
    return this.request<User>(usersEndpointRoute, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUser(userId: string): Promise<User> {
    return this.request<User>(`${usersEndpointRoute}/${userId}`);
  }

  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    return this.request<User>(`${usersEndpointRoute}/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request<void>(`${usersEndpointRoute}/${userId}`, {
      method: 'DELETE',
    });
  }

  // Card Management
  async createCard(request: CreateCardRequest): Promise<Card> {
    return this.request<Card>(cardsEndpointRoute, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCard(cardId: string): Promise<Card> {
    return this.request<Card>(`${cardsEndpointRoute}/${cardId}`);
  }

  async getUserCards(userId: string): Promise<Card[]> {
    return this.request<Card[]>(
      `${cardsEndpointRoute}?userId=${encodeURIComponent(userId)}`,
    );
  }

  async updateCard(cardId: string, request: UpdateCardRequest): Promise<Card> {
    return this.request<Card>(`${cardsEndpointRoute}/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.request<void>(`${cardsEndpointRoute}/${cardId}`, {
      method: 'DELETE',
    });
  }

  async getDueCards(query: DueCardsQuery): Promise<Card[]> {
    const params = new URLSearchParams({
      userId: query.userId,
    });

    if (query.tags && query.tags.length > 0) {
      params.append('tags', query.tags.join(','));
    }

    if (query.limit !== undefined) {
      params.append('limit', query.limit.toString());
    }

    if (query.currentDate) {
      params.append('currentDate', query.currentDate);
    }

    return this.request<Card[]>(
      `${cardsEndpointRoute}/due?${params.toString()}`,
    );
  }

  async reviewCard(
    cardId: string,
    request: ReviewCardRequest,
  ): Promise<ReviewCardResponse> {
    return this.request<ReviewCardResponse>(
      `${cardsEndpointRoute}/${cardId}/review`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
    );
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>(
      healthEndpointRoute,
    );
  }

  // Utility Methods
  /**
   * Create a complete study session workflow
   */
  async createStudySession(
    userId: string,
    options: {
      tags?: string[];
      limit?: number;
      currentDate?: Date;
    } = {},
  ): Promise<{
    dueCards: Card[];
    totalDue: number;
  }> {
    const dueCards = await this.getDueCards({
      userId,
      tags: options.tags,
      limit: options.limit,
      currentDate: options.currentDate?.toISOString(),
    });

    return {
      dueCards,
      totalDue: dueCards.length,
    };
  }

  /**
   * Batch review multiple cards
   */
  async batchReviewCards(
    reviews: Array<{
      cardId: string;
      response: 'failed' | 'good' | 'easy';
      reviewedAt?: Date;
    }>,
  ): Promise<ReviewCardResponse[]> {
    const results = await Promise.all(
      reviews.map((review) =>
        this.reviewCard(review.cardId, {
          response: review.response,
          reviewedAt: review.reviewedAt?.toISOString(),
        }),
      ),
    );

    return results;
  }

  /**
   * Get study statistics for a user
   */
  async getStudyStats(
    userId: string,
    options: {
      tags?: string[];
      currentDate?: Date;
    } = {},
  ): Promise<{
    totalCards: number;
    dueCards: number;
    dueToday: number;
  }> {
    const currentDate = options.currentDate || new Date();

    const [allCards, dueCards] = await Promise.all([
      this.getUserCards(userId),
      this.getDueCards({
        userId,
        tags: options.tags,
        currentDate: currentDate.toISOString(),
      }),
    ]);

    // Filter cards due today (before end of day)
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dueToday = dueCards.filter((card) => {
      const nextReview = new Date(card.scheduling.nextReviewDate);
      return nextReview <= endOfDay;
    }).length;

    return {
      totalCards: allCards.length,
      dueCards: dueCards.length,
      dueToday,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

// Default export for convenience
export default SpacedRepetitionClient;

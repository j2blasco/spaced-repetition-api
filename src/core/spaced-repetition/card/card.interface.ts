import { CardSchedulingData } from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-algorithm.interface';
import { UserId } from 'src/core/user/user.interface';

export type Card = {
  readonly id: string;
  readonly userId: UserId;
  readonly tags: readonly string[];
  readonly data: Record<string, unknown>;
  readonly scheduling: CardSchedulingData;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export interface CreateCardRequest {
  readonly userId: UserId;
  readonly tags?: readonly string[];
  readonly data: Record<string, unknown>;
}

export interface UpdateCardRequest {
  readonly tags?: readonly string[];
  readonly data?: Record<string, unknown>;
}

export interface DueCardsQuery {
  readonly userId: UserId;
  readonly tags?: readonly string[];
  readonly limit?: number;
  readonly currentDate?: Date;
}

export interface ICardRepository {
  /**
   * Create a new card
   */
  create(request: CreateCardRequest): Promise<Card>;

  /**
   * Find a card by ID
   */
  findById(id: string): Promise<Card | null>;

  /**
   * Find all cards for a user
   */
  findByUserId(userId: UserId): Promise<readonly Card[]>;

  /**
   * Find cards by tags (supports partial matching)
   */
  findByTags(userId: UserId, tags: readonly string[]): Promise<readonly Card[]>;

  /**
   * Find cards that are due for review
   */
  findDueCards(query: DueCardsQuery): Promise<readonly Card[]>;

  /**
   * Update an existing card
   */
  update(id: string, request: UpdateCardRequest): Promise<Card>;

  /**
   * Delete a card
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a card exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get total card count for a user
   */
  getCardCount(userId: UserId): Promise<number>;

  /**
   * Get cards count by tags for a user
   */
  getCardCountsByTags(userId: UserId): Promise<Record<string, number>>;
}

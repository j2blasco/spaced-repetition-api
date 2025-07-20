import { randomUUID } from 'crypto';
import {
  Card,
  ICardRepository,
  CreateCardRequest,
  UpdateCardRequest,
  DueCardsQuery,
} from './card.interface';
import {
  AlgorithmType,
  CardSchedulingData,
} from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-algorithm.interface';
import { UserId } from 'src/core/user/user.interface';

/**
 * In-memory implementation of CardRepository for testing purposes
 */
export class InMemoryCardRepository implements ICardRepository {
  private cards: Map<string, Card> = new Map();

  private createInitialScheduling(): CardSchedulingData {
    const now = new Date();
    return {
      algorithmType: AlgorithmType.SM2,
      nextReviewDate: now, // New cards are immediately available
      lastReviewDate: undefined,
      algorithmData: {
        algorithm: AlgorithmType.SM2,
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
        cardState: 'new',
      },
    };
  }

  async create(request: CreateCardRequest): Promise<Card> {
    const id = randomUUID();
    const now = new Date();
    
    const card: Card = {
      id,
      userId: request.userId,
      tags: request.tags || [],
      data: request.data,
      scheduling: this.createInitialScheduling(),
      createdAt: now,
      updatedAt: now,
    };

    this.cards.set(id, card);
    return card;
  }

  async findById(id: string): Promise<Card | null> {
    return this.cards.get(id) || null;
  }

  async findByUserId(userId: UserId): Promise<readonly Card[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.userId === userId,
    );
  }

  async findByTags(
    userId: UserId,
    tags: readonly string[],
  ): Promise<readonly Card[]> {
    return Array.from(this.cards.values()).filter((card) => {
      if (card.userId !== userId) return false;

      // Check if card has any of the specified tags
      return tags.some((tag) => card.tags.includes(tag));
    });
  }

  async findDueCards(query: DueCardsQuery): Promise<readonly Card[]> {
    const now = new Date();
    let filteredCards = Array.from(this.cards.values());

    // Filter by user
    filteredCards = filteredCards.filter(
      (card) => card.userId === query.userId,
    );

    // Filter by tags if specified
    if (query.tags && query.tags.length > 0) {
      filteredCards = filteredCards.filter((card) =>
        query.tags!.some((tag) => card.tags.includes(tag)),
      );
    }

    // Filter by cards that are due
    filteredCards = filteredCards.filter((card) => {
      const isDue = card.scheduling.nextReviewDate <= now;
      return isDue;
    });

    // Limit results if specified
    if (query.limit) {
      filteredCards = filteredCards.slice(0, query.limit);
    }

    return filteredCards;
  }

  async update(id: string, request: UpdateCardRequest): Promise<Card> {
    const existingCard = this.cards.get(id);
    if (!existingCard) {
      throw new Error(`Card with id '${id}' not found`);
    }

    const updatedCard: Card = {
      ...existingCard,
      tags: request.tags ?? existingCard.tags,
      data: request.data ?? existingCard.data,
      scheduling: existingCard.scheduling,
      updatedAt: new Date(),
    };

    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  async delete(id: string): Promise<void> {
    const exists = this.cards.has(id);
    if (!exists) {
      throw new Error(`Card with id '${id}' not found`);
    }
    this.cards.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.cards.has(id);
  }

  async getCardCount(userId: UserId): Promise<number> {
    const userCards = await this.findByUserId(userId);
    return userCards.length;
  }

  async getCardCountsByTags(userId: UserId): Promise<Record<string, number>> {
    const userCards = await this.findByUserId(userId);
    const counts: Record<string, number> = {};

    for (const card of userCards) {
      for (const tag of card.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }

    return counts;
  }

  // Helper method for testing
  clear(): void {
    this.cards.clear();
  }
}

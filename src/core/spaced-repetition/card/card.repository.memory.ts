import { randomUUID } from 'crypto';
import {
  Card,
  ICardRepository,
  CreateCardRequest,
  UpdateCardRequest,
  DueCardsQuery,
  CardState,
} from './card.interface.js';
import {
  AlgorithmType,
  CardSchedulingData,
} from 'src/services/spaced-repetition-algorithm/core/spaced-repetition-algorithm.interface.js';

/**
 * In-memory implementation of CardRepository for testing purposes
 */
export class InMemoryCardRepository implements ICardRepository {
  private cards: Map<string, Card> = new Map();

  private createInitialScheduling(
    algorithm: 'sm2' | 'sm4' | 'fsrs' = 'sm2',
  ): CardSchedulingData {
    const now = new Date();
    const algorithmType = this.mapAlgorithmString(algorithm);
    return {
      algorithmType,
      nextReviewDate: now, // New cards are immediately available
      lastReviewDate: undefined,
      algorithmData: {
        algorithm: algorithm as AlgorithmType,
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
        cardState: 'new' as CardState,
      },
    };
  }

  private mapAlgorithmString(algorithm: 'sm2' | 'sm4' | 'fsrs'): AlgorithmType {
    switch (algorithm) {
      case 'sm2':
        return AlgorithmType.SM2;
      case 'sm4':
        return AlgorithmType.SM4;
      case 'fsrs':
        return AlgorithmType.FSRS;
      default:
        return AlgorithmType.SM2;
    }
  }

  async create(request: CreateCardRequest): Promise<Card> {
    const id: string = randomUUID();
    const now = new Date();

    const card: Card = {
      id,
      noteId: request.noteId,
      deckId: request.deckId,
      cardType: request.cardType,
      front: request.front,
      back: request.back,
      scheduling: this.createInitialScheduling(request.algorithm),
      createdAt: now,
      updatedAt: now,
    };

    this.cards.set(id, card);
    return card;
  }

  async findById(id: string): Promise<Card | null> {
    return this.cards.get(id) || null;
  }

  async findByDeckId(deckId: string): Promise<readonly Card[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.deckId === deckId,
    );
  }

  async findByNoteId(noteId: string): Promise<readonly Card[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.noteId === noteId,
    );
  }

  async findDueCards(query: DueCardsQuery): Promise<readonly Card[]> {
    const now = new Date();
    let filteredCards = Array.from(this.cards.values());

    // Filter by deck if specified
    if (query.deckId) {
      filteredCards = filteredCards.filter(
        (card) => card.deckId === query.deckId!,
      );
    }

    // Filter by cards that are due
    filteredCards = filteredCards.filter((card) => {
      const isDue = card.scheduling.nextReviewDate <= now;
      const isNew =
        (card.scheduling.algorithmData as { cardState?: string })?.cardState ===
        'new';

      return isDue && (query.includeNew !== false || !isNew);
    });

    // Limit results if specified
    if (query.maxCards) {
      filteredCards = filteredCards.slice(0, query.maxCards);
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
      front: request.front ?? existingCard.front,
      back: request.back ?? existingCard.back,
      cardType: request.cardType ?? existingCard.cardType,
      scheduling: request.scheduling ?? existingCard.scheduling,
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

  async getCardCountsByState(
    deckId: string,
  ): Promise<Record<CardState, number>> {
    const deckCards = await this.findByDeckId(deckId);

    const counts: Record<CardState, number> = {
      new: 0,
      learning: 0,
      review: 0,
      relearning: 0,
    };

    for (const card of deckCards) {
      const state =
        (card.scheduling.algorithmData as { cardState?: string })?.cardState ||
        'new';
      counts[state as CardState]++;
    }

    return counts;
  }

  // Helper method for testing
  clear(): void {
    this.cards.clear();
  }
}

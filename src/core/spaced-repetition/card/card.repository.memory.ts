import { randomUUID } from 'crypto';
import {
  Card,
  CardId,
  CardRepository,
  CreateCardRequest,
  UpdateCardRequest,
  DueCardsQuery,
  CardState,
} from './card.interface.js';
import { DeckId } from '../deck/deck.interface.js';
import { NoteId } from '../note/note.interface.js';
import {
  AlgorithmType,
  CardSchedulingData,
} from 'src/services/spaced-repetition-algorithm/index.js';

/**
 * In-memory implementation of CardRepository for testing purposes
 */
export class InMemoryCardRepository implements CardRepository {
  private cards: Map<string, Card> = new Map();

  private createInitialScheduling(
    algorithm: 'sm2' | 'sm4' | 'fsrs' = 'sm2',
  ): CardSchedulingData {
    const now = new Date();
    return {
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

  async create(request: CreateCardRequest): Promise<Card> {
    const id: CardId = { value: randomUUID() };
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

    this.cards.set(id.value, card);
    return card;
  }

  async findById(id: CardId): Promise<Card | null> {
    return this.cards.get(id.value) || null;
  }

  async findByDeckId(deckId: DeckId): Promise<readonly Card[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.deckId.value === deckId.value,
    );
  }

  async findByNoteId(noteId: NoteId): Promise<readonly Card[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.noteId.value === noteId.value,
    );
  }

  async findDueCards(query: DueCardsQuery): Promise<readonly Card[]> {
    const now = new Date();
    let filteredCards = Array.from(this.cards.values());

    // Filter by deck if specified
    if (query.deckId) {
      filteredCards = filteredCards.filter(
        (card) => card.deckId.value === query.deckId!.value,
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

  async update(id: CardId, request: UpdateCardRequest): Promise<Card> {
    const existingCard = this.cards.get(id.value);
    if (!existingCard) {
      throw new Error(`Card with id '${id.value}' not found`);
    }

    const updatedCard: Card = {
      ...existingCard,
      front: request.front ?? existingCard.front,
      back: request.back ?? existingCard.back,
      cardType: request.cardType ?? existingCard.cardType,
      scheduling: request.scheduling ?? existingCard.scheduling,
      updatedAt: new Date(),
    };

    this.cards.set(id.value, updatedCard);
    return updatedCard;
  }

  async delete(id: CardId): Promise<void> {
    const exists = this.cards.has(id.value);
    if (!exists) {
      throw new Error(`Card with id '${id.value}' not found`);
    }
    this.cards.delete(id.value);
  }

  async exists(id: CardId): Promise<boolean> {
    return this.cards.has(id.value);
  }

  async getCardCountsByState(
    deckId: DeckId,
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

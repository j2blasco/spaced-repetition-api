import { randomUUID } from 'crypto';
import {
  Deck,
  DeckId,
  DeckRepository,
  CreateDeckRequest,
  UpdateDeckRequest,
} from './deck.interface.js';
import { UserId } from '../user/user.interface.js';

/**
 * In-memory implementation of DeckRepository for testing purposes
 */
export class InMemoryDeckRepository implements DeckRepository {
  private decks: Map<string, Deck> = new Map();

  async create(request: CreateDeckRequest): Promise<Deck> {
    const id: DeckId = { value: randomUUID() };
    const now = new Date();

    const deck: Deck = {
      id,
      userId: request.userId,
      name: request.name,
      description: request.description ?? '',
      tags: request.tags ?? [],
      isPublic: request.isPublic ?? false,
      defaultAlgorithm: request.defaultAlgorithm ?? 'sm2',
      createdAt: now,
      updatedAt: now,
      cardCount: 0,
      newCardsToday: 0,
      reviewsToday: 0,
    };

    this.decks.set(id.value, deck);
    return deck;
  }

  async findById(id: DeckId): Promise<Deck | null> {
    return this.decks.get(id.value) || null;
  }

  async findByUserId(userId: UserId): Promise<readonly Deck[]> {
    return Array.from(this.decks.values()).filter(
      (deck) => deck.userId.value === userId.value,
    );
  }

  async findPublicDecks(): Promise<readonly Deck[]> {
    return Array.from(this.decks.values()).filter((deck) => deck.isPublic);
  }

  async update(id: DeckId, request: UpdateDeckRequest): Promise<Deck> {
    const existingDeck = this.decks.get(id.value);
    if (!existingDeck) {
      throw new Error(`Deck with id '${id.value}' not found`);
    }

    const updatedDeck: Deck = {
      ...existingDeck,
      name: request.name ?? existingDeck.name,
      description: request.description ?? existingDeck.description,
      tags: request.tags ?? existingDeck.tags,
      isPublic: request.isPublic ?? existingDeck.isPublic,
      defaultAlgorithm:
        request.defaultAlgorithm ?? existingDeck.defaultAlgorithm,
      cardCount: request.cardCount ?? existingDeck.cardCount,
      newCardsToday: request.newCardsToday ?? existingDeck.newCardsToday,
      reviewsToday: request.reviewsToday ?? existingDeck.reviewsToday,
      updatedAt: new Date(),
    };

    this.decks.set(id.value, updatedDeck);
    return updatedDeck;
  }

  async delete(id: DeckId): Promise<void> {
    const exists = this.decks.has(id.value);
    if (!exists) {
      throw new Error(`Deck with id '${id.value}' not found`);
    }
    this.decks.delete(id.value);
  }

  async exists(id: DeckId): Promise<boolean> {
    return this.decks.has(id.value);
  }

  async isOwnedByUser(deckId: DeckId, userId: UserId): Promise<boolean> {
    const deck = this.decks.get(deckId.value);
    return deck ? deck.userId.value === userId.value : false;
  }

  async clone(sourceDeckId: DeckId, targetUserId: UserId): Promise<Deck> {
    const sourceDeck = this.decks.get(sourceDeckId.value);
    if (!sourceDeck) {
      throw new Error(`Source deck with id '${sourceDeckId.value}' not found`);
    }

    if (!sourceDeck.isPublic) {
      throw new Error('Cannot clone a private deck');
    }

    const id: DeckId = { value: randomUUID() };
    const now = new Date();

    const clonedDeck: Deck = {
      ...sourceDeck,
      id,
      userId: targetUserId,
      isPublic: false, // Cloned decks are private by default
      createdAt: now,
      updatedAt: now,
      cardCount: 0, // Will be updated when cards are cloned
      newCardsToday: 0,
      reviewsToday: 0,
    };

    this.decks.set(id.value, clonedDeck);
    return clonedDeck;
  }

  // Helper method for testing
  clear(): void {
    this.decks.clear();
  }
}

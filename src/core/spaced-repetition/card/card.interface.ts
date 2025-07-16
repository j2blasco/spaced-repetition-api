import { CardSchedulingData } from 'src/services/spaced-repetition-algorithm/core/spaced-repetition-algorithm.interface.js';
import { DeckId } from '../deck/deck.interface.js';
import { NoteId } from '../note/note.interface.js';

export interface CardId {
  readonly value: string;
}

export type CardType = 'basic' | 'reverse' | 'cloze';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface Card {
  readonly id: CardId;
  readonly noteId: NoteId;
  readonly deckId: DeckId;
  readonly cardType: CardType;
  readonly front: string;
  readonly back: string;
  readonly scheduling: CardSchedulingData;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateCardRequest {
  readonly noteId: NoteId;
  readonly deckId: DeckId;
  readonly cardType: CardType;
  readonly front: string;
  readonly back: string;
  readonly algorithm?: 'sm2' | 'sm4' | 'fsrs';
}

export interface UpdateCardRequest {
  readonly front?: string;
  readonly back?: string;
  readonly cardType?: CardType;
  readonly scheduling?: CardSchedulingData;
}

export interface DueCardsQuery {
  readonly userId?: string;
  readonly deckId?: DeckId;
  readonly maxCards?: number;
  readonly includeNew?: boolean;
}

export interface CardRepository {
  /**
   * Create a new card
   */
  create(request: CreateCardRequest): Promise<Card>;

  /**
   * Find a card by ID
   */
  findById(id: CardId): Promise<Card | null>;

  /**
   * Find all cards in a deck
   */
  findByDeckId(deckId: DeckId): Promise<readonly Card[]>;

  /**
   * Find all cards for a note
   */
  findByNoteId(noteId: NoteId): Promise<readonly Card[]>;

  /**
   * Find cards that are due for review
   */
  findDueCards(query: DueCardsQuery): Promise<readonly Card[]>;

  /**
   * Update an existing card
   */
  update(id: CardId, request: UpdateCardRequest): Promise<Card>;

  /**
   * Delete a card
   */
  delete(id: CardId): Promise<void>;

  /**
   * Check if a card exists
   */
  exists(id: CardId): Promise<boolean>;

  /**
   * Get cards count by state for a deck
   */
  getCardCountsByState(deckId: DeckId): Promise<Record<CardState, number>>;
}

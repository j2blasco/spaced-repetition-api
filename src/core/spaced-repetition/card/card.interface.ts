import { AlgorithmType, CardSchedulingData } from 'src/services/spaced-repetition-algorithm/core/spaced-repetition-algorithm.interface.js';

export type CardType = 'basic' | 'reverse' | 'cloze';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export type Card = {
  readonly id: string;
  readonly noteId: string;
  readonly deckId: string;
  readonly cardType: CardType;
  readonly front: string;
  readonly back: string;
  readonly scheduling: CardSchedulingData;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateCardRequest = {
  readonly noteId: string;
  readonly deckId: string;
  readonly cardType: CardType;
  readonly front: string;
  readonly back: string;
  readonly algorithm: AlgorithmType;
};

export type UpdateCardRequest = {
  readonly front?: string;
  readonly back?: string;
  readonly cardType?: CardType;
  readonly scheduling?: CardSchedulingData;
};

export type DueCardsQuery = {
  readonly userId?: string;
  readonly deckId?: string;
  readonly maxCards?: number;
  readonly includeNew?: boolean;
};

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
   * Find all cards in a deck
   */
  findByDeckId(deckId: string): Promise<readonly Card[]>;

  /**
   * Find all cards for a note
   */
  findByNoteId(noteId: string): Promise<readonly Card[]>;

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
   * Get cards count by state for a deck
   */
  getCardCountsByState(deckId: string): Promise<Record<CardState, number>>;
}

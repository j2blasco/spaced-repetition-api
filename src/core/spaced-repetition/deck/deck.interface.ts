import { UserId } from 'src/core/user/user.interface';

export interface DeckId {
  readonly value: string;
}

export interface Deck {
  readonly id: DeckId;
  readonly userId: UserId;
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly isPublic: boolean;
  readonly defaultAlgorithm: 'sm2' | 'sm4' | 'fsrs';
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly cardCount: number;
  readonly newCardsToday: number;
  readonly reviewsToday: number;
}

export interface CreateDeckRequest {
  readonly userId: UserId;
  readonly name: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly isPublic?: boolean;
  readonly defaultAlgorithm?: 'sm2' | 'sm4' | 'fsrs';
}

export interface UpdateDeckRequest {
  readonly name?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly isPublic?: boolean;
  readonly defaultAlgorithm?: 'sm2' | 'sm4' | 'fsrs';
  readonly cardCount?: number;
  readonly newCardsToday?: number;
  readonly reviewsToday?: number;
}

export interface DeckRepository {
  /**
   * Create a new deck
   */
  create(request: CreateDeckRequest): Promise<Deck>;

  /**
   * Find a deck by ID
   */
  findById(id: DeckId): Promise<Deck | null>;

  /**
   * Find all decks for a user
   */
  findByUserId(userId: UserId): Promise<readonly Deck[]>;

  /**
   * Find public decks
   */
  findPublicDecks(): Promise<readonly Deck[]>;

  /**
   * Update an existing deck
   */
  update(id: DeckId, request: UpdateDeckRequest): Promise<Deck>;

  /**
   * Delete a deck
   */
  delete(id: DeckId): Promise<void>;

  /**
   * Check if a deck exists
   */
  exists(id: DeckId): Promise<boolean>;

  /**
   * Check if a user owns a deck
   */
  isOwnedByUser(deckId: DeckId, userId: UserId): Promise<boolean>;

  /**
   * Clone a public deck for a user
   */
  clone(sourceDeckId: DeckId, targetUserId: UserId): Promise<Deck>;
}

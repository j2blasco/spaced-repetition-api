import { UserId } from '../user/user.interface';
import { CardId, Card, CreateCardRequest } from './card/card.interface';
import { DeckId } from './deck/deck.interface';
import { Review } from './review/review.interface';

export interface StudySession {
  readonly userId: UserId;
  readonly deckId?: DeckId;
  readonly maxCards?: number;
  readonly includeNewCards?: boolean;
}

export interface ReviewCardRequest {
  readonly cardId: CardId;
  readonly userId: UserId;
  readonly response: 'again' | 'hard' | 'good' | 'easy';
  readonly responseTime?: number;
}

export interface StudySessionResult {
  readonly dueCards: readonly Card[];
  readonly newCards: readonly Card[];
  readonly totalCards: number;
}

/**
 * Core service interface for spaced repetition functionality
 * This orchestrates the interaction between cards, reviews, and scheduling algorithms
 */
export interface SpacedRepetitionService {
  /**
   * Create a new card with initial scheduling
   */
  createCard(request: CreateCardRequest): Promise<Card>;

  /**
   * Get cards for a study session
   */
  getStudySession(session: StudySession): Promise<StudySessionResult>;

  /**
   * Review a card and update its scheduling
   */
  reviewCard(request: ReviewCardRequest): Promise<{
    updatedCard: Card;
    review: Review;
  }>;

  /**
   * Get the next review date for a card
   */
  getNextReviewDate(cardId: CardId): Promise<Date | null>;

  /**
   * Check if a card is due for review
   */
  isCardDue(cardId: CardId): Promise<boolean>;

  /**
   * Get cards due for review for a specific user/deck
   */
  getDueCards(userId: UserId, deckId?: DeckId): Promise<readonly Card[]>;
}

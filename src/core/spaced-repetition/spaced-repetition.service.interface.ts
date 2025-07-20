import { UserId } from '../user/user.interface';
import { Card, CreateCardRequest } from './card/card.interface';
import { ReviewResponse } from './review/review.interface';

export interface StudySession {
  readonly userId: UserId;
  readonly tags?: readonly string[];
  readonly maxCards?: number;
  readonly includeNewCards?: boolean;
}

export interface ReviewCardRequest {
  readonly cardId: string;
  readonly userId: UserId;
  readonly response: ReviewResponse;
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
  reviewCard(request: ReviewCardRequest): Promise<Card>;

  /**
   * Get the next review date for a card
   */
  getNextReviewDate(cardId: string): Promise<Date | null>;

  /**
   * Check if a card is due for review
   */
  isCardDue(cardId: string): Promise<boolean>;

  /**
   * Get cards due for review for a specific user with optional tag filtering
   */
  getDueCards(
    userId: UserId,
    tags?: readonly string[],
  ): Promise<readonly Card[]>;
}

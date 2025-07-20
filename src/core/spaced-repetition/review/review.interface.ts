import { UserId } from 'src/core/user/user.interface';

export type ReviewId = string;

export type ReviewResponse = 'again' | 'hard' | 'good' | 'easy';

export interface Review {
  readonly id: ReviewId;
  readonly cardId: string;
  readonly userId: UserId;
  readonly response: ReviewResponse;
  readonly responseTime: number; // in seconds
  readonly reviewedAt: Date;
  readonly previousInterval: number;
  readonly newInterval: number;
}

export interface CreateReviewRequest {
  readonly cardId: string;
  readonly userId: UserId;
  readonly response: ReviewResponse;
  readonly responseTime?: number;
}

export interface ReviewRepository {
  /**
   * Create a new review
   */
  create(request: CreateReviewRequest): Promise<Review>;

  /**
   * Find a review by ID
   */
  findById(id: ReviewId): Promise<Review | null>;

  /**
   * Find all reviews for a card
   */
  findByCardId(cardId: string): Promise<readonly Review[]>;

  /**
   * Find all reviews by a user
   */
  findByUserId(userId: UserId): Promise<readonly Review[]>;

  /**
   * Find reviews for a user within a date range
   */
  findByUserIdInDateRange(
    userId: UserId,
    startDate: Date,
    endDate: Date,
  ): Promise<readonly Review[]>;

  /**
   * Get review statistics for a user
   */
  getReviewStats(userId: UserId, days: number): Promise<ReviewStats>;
}

export interface ReviewStats {
  readonly totalReviews: number;
  readonly averageResponseTime: number;
  readonly responseDistribution: Record<ReviewResponse, number>;
  readonly dailyReviewCounts: readonly { date: Date; count: number }[];
}

import { randomUUID } from 'crypto';
import {
  Review,
  ReviewId,
  ReviewRepository,
  CreateReviewRequest,
  ReviewStats,
  ReviewResponse,
} from './review.interface.js';
import { CardId } from '../card/card.interface.js';
import { UserId } from '../user/user.interface.js';

/**
 * In-memory implementation of ReviewRepository for testing purposes
 */
export class InMemoryReviewRepository implements ReviewRepository {
  private reviews: Map<string, Review> = new Map();

  async create(request: CreateReviewRequest): Promise<Review> {
    const id: ReviewId = { value: randomUUID() };
    const now = new Date();

    const review: Review = {
      id,
      cardId: request.cardId,
      userId: request.userId,
      response: request.response,
      responseTime: request.responseTime ?? 0,
      reviewedAt: now,
      previousInterval: 0, // Will be set by the service layer
      newInterval: 0, // Will be set by the service layer
    };

    this.reviews.set(id.value, review);
    return review;
  }

  async findById(id: ReviewId): Promise<Review | null> {
    return this.reviews.get(id.value) || null;
  }

  async findByCardId(cardId: CardId): Promise<readonly Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.cardId.value === cardId.value,
    );
  }

  async findByUserId(userId: UserId): Promise<readonly Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.userId.value === userId.value,
    );
  }

  async findByUserIdInDateRange(
    userId: UserId,
    startDate: Date,
    endDate: Date,
  ): Promise<readonly Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) =>
        review.userId.value === userId.value &&
        review.reviewedAt >= startDate &&
        review.reviewedAt <= endDate,
    );
  }

  async getReviewStats(userId: UserId, days: number): Promise<ReviewStats> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const userReviews = await this.findByUserIdInDateRange(
      userId,
      startDate,
      endDate,
    );

    const totalReviews = userReviews.length;
    const averageResponseTime =
      totalReviews > 0
        ? userReviews.reduce((sum, review) => sum + review.responseTime, 0) /
          totalReviews
        : 0;

    const responseDistribution: Record<ReviewResponse, number> = {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    };

    userReviews.forEach((review) => {
      responseDistribution[review.response]++;
    });

    // Group reviews by day
    const dailyReviewsMap = new Map<string, number>();
    userReviews.forEach((review) => {
      const dateKey = review.reviewedAt.toISOString().split('T')[0];
      dailyReviewsMap.set(dateKey, (dailyReviewsMap.get(dateKey) || 0) + 1);
    });

    const dailyReviewCounts = Array.from(dailyReviewsMap.entries()).map(
      ([dateString, count]) => ({
        date: new Date(dateString),
        count,
      }),
    );

    return {
      totalReviews,
      averageResponseTime,
      responseDistribution,
      dailyReviewCounts,
    };
  }

  // Helper method for testing
  clear(): void {
    this.reviews.clear();
  }
}

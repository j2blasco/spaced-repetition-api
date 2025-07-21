import { CardSchedulingData } from '../core/spaced-repetition-scheduler.interface';

/**
 * Utility functions for working with spaced repetition scheduling
 */

/**
 * Calculate the interval (in days) between the last review and next review dates
 * If no last review date is provided, calculates from current date
 */
export function calculateInterval<TAlgorithmData>(
  schedulingData: CardSchedulingData<TAlgorithmData>,
  fromDate?: Date,
): number {
  const baseDate = fromDate || new Date();
  const timeDiff = schedulingData.nextReviewDate.getTime() - baseDate.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))); // Convert to days
}

/**
 * Calculate the change in interval between two scheduling states
 * Positive = increased interval, Negative = decreased interval
 */
export function calculateIntervalChange<TAlgorithmData>(
  previousScheduling: CardSchedulingData<TAlgorithmData>,
  newScheduling: CardSchedulingData<TAlgorithmData>,
  fromDate?: Date,
): number {
  const previousInterval = calculateInterval(previousScheduling, fromDate);
  const newInterval = calculateInterval(newScheduling, fromDate);
  return newInterval - previousInterval;
}

/**
 * Check if a card is due for review
 */
export function isCardDue<TAlgorithmData>(
  schedulingData: CardSchedulingData<TAlgorithmData>,
  currentDate?: Date,
): boolean {
  const now = currentDate || new Date();
  return schedulingData.nextReviewDate <= now;
}

/**
 * Get the number of days until the next review
 * Returns 0 if the card is already due
 */
export function getDaysUntilReview<TAlgorithmData>(
  schedulingData: CardSchedulingData<TAlgorithmData>,
  currentDate?: Date,
): number {
  const now = currentDate || new Date();
  const timeDiff = schedulingData.nextReviewDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
}

/**
 * Create a new scheduling data with updated next review date based on interval
 */
export function updateSchedulingWithInterval<TAlgorithmData>(
  schedulingData: CardSchedulingData<TAlgorithmData>,
  intervalDays: number,
  reviewDate: Date = new Date(),
): CardSchedulingData<TAlgorithmData> {
  const nextReviewDate = new Date(reviewDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    ...schedulingData,
    nextReviewDate,
  };
}

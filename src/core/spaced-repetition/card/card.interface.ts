import {
  ErrorUnknown,
  ErrorWithCode,
  Result,
  SuccessVoid,
} from '@j2blasco/ts-result';
import {
  AlgorithmType,
  CardSchedulingData,
} from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';
import { UserId } from 'src/core/user/user.interface';

export type Card = {
  readonly id: string;
  readonly userId: UserId;
  readonly tags: readonly string[];
  readonly data: Record<string, unknown>;
  readonly scheduling: CardSchedulingData;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export interface CreateCardRequest {
  readonly userId: UserId;
  readonly tags?: readonly string[];
  readonly data: Record<string, unknown>;
  readonly algorithmType: AlgorithmType;
}

export interface UpdateCardRequest {
  readonly tags?: readonly string[];
  readonly data?: Record<string, unknown>;
  readonly scheduling?: CardSchedulingData;
}

export interface DueCardsQuery {
  readonly userId: UserId;
  readonly tags?: readonly string[];
  readonly limit?: number;
  readonly currentDate?: Date;
}

export interface ICardRepository {
  /**
   * Create a new card
   */
  create(request: CreateCardRequest): Promise<Result<Card, ErrorUnknown>>;

  /**
   * Find a card by ID
   */
  findById(
    id: string,
  ): Promise<Result<Card, ErrorWithCode<'not-found'> | ErrorUnknown>>;

  /**
   * Find all cards for a user
   */
  findByUserId(userId: UserId): Promise<Result<readonly Card[], ErrorUnknown>>;

  /**
   * Find cards by tags (supports partial matching)
   */
  findByTags(
    userId: UserId,
    tags: readonly string[],
  ): Promise<Result<readonly Card[], ErrorUnknown>>;

  /**
   * Find cards that are due for review
   */
  findDueCards(
    query: DueCardsQuery,
  ): Promise<Result<readonly Card[], ErrorUnknown>>;

  /**
   * Update an existing card
   */
  update(
    id: string,
    request: UpdateCardRequest,
  ): Promise<Result<Card, ErrorWithCode<'not-found'> | ErrorUnknown>>;

  /**
   * Delete a card
   */
  delete(
    id: string,
  ): Promise<Result<SuccessVoid, ErrorWithCode<'not-found'> | ErrorUnknown>>;
}

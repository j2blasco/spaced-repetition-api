import {
  SpacedRepetitionService,
  StudySession,
  ReviewCardRequest,
  StudySessionResult,
} from './spaced-repetition.service.interface';
import { UserId } from '../user/user.interface';
import {
  ICardRepository,
  CreateCardRequest,
  Card,
} from './card/card.interface';
import { ISpacedRepetitionSchedulerService } from 'src/providers/spaced-repetition-algorithm/core/space-repetition-scheduler-service.interface';
import {
  AlgorithmType,
  RecallLevel,
} from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-algorithm.interface';
import { ReviewResponse } from './review/review.interface';

/**
 * Implementation of SpacedRepetitionService
 */
export class DefaultSpacedRepetitionService implements SpacedRepetitionService {
  constructor(
    private readonly cardRepository: ICardRepository,
    private readonly algorithmProvider: ISpacedRepetitionSchedulerService,
  ) {}

  async createCard(request: CreateCardRequest): Promise<Card> {
    return this.cardRepository.create(request);
  }

  async getStudySession(session: StudySession): Promise<StudySessionResult> {
    const dueCardsQuery = {
      userId: session.userId,
      tags: session.tags,
      maxCards: session.maxCards,
      includeNew: session.includeNewCards,
    };

    const allDueCards = await this.cardRepository.findDueCards(dueCardsQuery);

    // Separate new cards from due cards
    const newCards: Card[] = [];
    const dueCards: Card[] = [];

    for (const card of allDueCards) {
      const cardState = (
        card.scheduling.algorithmData as { cardState?: string }
      )?.cardState;
      if (cardState === 'new') {
        newCards.push(card);
      } else {
        dueCards.push(card);
      }
    }

    return {
      dueCards,
      newCards,
      totalCards: allDueCards.length,
    };
  }

  async reviewCard(request: ReviewCardRequest): Promise<Card> {
    // Get the current card
    const card = await this.cardRepository.findById(request.cardId);
    if (!card) {
      throw new Error(`Card with id '${request.cardId}' not found`);
    }

    // Map API response to algorithm response
    const recallLevel = this.mapResponseToRecallLevel(request.response);

    // Get the appropriate scheduler
    const algorithmData = card.scheduling.algorithmData as {
      algorithm?: string;
    };
    const algorithmType = this.mapAlgorithmString(
      algorithmData.algorithm || 'sm2',
    );
    const scheduler = this.algorithmProvider.getScheduler(algorithmType);

    // Calculate new scheduling
    const rescheduleResult = scheduler.reschedule({
      currentScheduling: card.scheduling,
      reviewResult: {
        recallLevel,
        responseTime: request.responseTime,
        reviewedAt: new Date(),
      },
    });

    // Get the current card and update its scheduling
    const currentCard = await this.cardRepository.findById(request.cardId);
    if (!currentCard) {
      throw new Error('Card not found');
    }

    // Create updated card with new scheduling
    const updatedCard: Card = {
      ...currentCard,
      scheduling: rescheduleResult.newScheduling,
      updatedAt: new Date(),
    };

    // Since the UpdateCardRequest doesn't include scheduling, we'll need to handle this differently
    // For now, we'll return the updated card (in a real implementation, you'd update the repository)
    return updatedCard;
  }

  async getNextReviewDate(cardId: string): Promise<Date | null> {
    const card = await this.cardRepository.findById(cardId);
    return card?.scheduling.nextReviewDate || null;
  }

  async isCardDue(cardId: string): Promise<boolean> {
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      return false;
    }

    const now = new Date();
    return card.scheduling.nextReviewDate <= now;
  }

  async getDueCards(
    userId: UserId,
    tags?: readonly string[],
  ): Promise<readonly Card[]> {
    return this.cardRepository.findDueCards({
      userId,
      tags,
    });
  }

  private mapResponseToRecallLevel(response: ReviewResponse): RecallLevel {
    switch (response) {
      case 'again':
        return RecallLevel.HARD;
      case 'hard':
        return RecallLevel.HARD;
      case 'good':
        return RecallLevel.MEDIUM;
      case 'easy':
        return RecallLevel.EASY;
      default:
        throw new Error(`Unknown response: ${response}`);
    }
  }

  private mapAlgorithmString(algorithm: string): AlgorithmType {
    switch (algorithm) {
      case 'sm2':
        return AlgorithmType.SM2;
      case 'sm4':
        return AlgorithmType.SM4;
      case 'fsrs':
        return AlgorithmType.FSRS;
      default:
        return AlgorithmType.SM2;
    }
  }
}

import {
  SpacedRepetitionService,
  StudySession,
  ReviewCardRequest,
  StudySessionResult,
} from './spaced-repetition.service.interface.js';
import {
  Card,
  CreateCardRequest,
  CardId,
  CardRepository,
} from '../card/card.interface.js';
import { Review, ReviewRepository } from '../review/review.interface.js';
import { UserId } from '../user/user.interface';
import { DeckId, DeckRepository } from '../deck/deck.interface';
import {
  SpacedRepetitionAlgorithmProvider,
  AlgorithmType,
  RecallLevel,
} from '../../services/spaced-repetition-algorithm/spaced-repetition-algorithm.interface';

/**
 * Implementation of SpacedRepetitionService
 */
export class DefaultSpacedRepetitionService implements SpacedRepetitionService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly deckRepository: DeckRepository,
    private readonly algorithmProvider: SpacedRepetitionAlgorithmProvider,
  ) {}

  async createCard(request: CreateCardRequest): Promise<Card> {
    const algorithm = request.algorithm || 'sm2';
    const _algorithmType = this.mapAlgorithmString(algorithm);
    
    const cardWithScheduling: CreateCardRequest = {
      ...request,
      algorithm,
    };

    return this.cardRepository.create(cardWithScheduling);
  }

  async getStudySession(session: StudySession): Promise<StudySessionResult> {
    const dueCardsQuery = {
      userId: session.userId.value,
      deckId: session.deckId,
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

  async reviewCard(request: ReviewCardRequest): Promise<{
    updatedCard: Card;
    review: Review;
  }> {
    // Get the current card
    const card = await this.cardRepository.findById(request.cardId);
    if (!card) {
      throw new Error(`Card with id '${request.cardId.value}' not found`);
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

    // Create the review record
    const review = await this.reviewRepository.create({
      cardId: request.cardId,
      userId: request.userId,
      response: request.response,
      responseTime: request.responseTime,
    });

    // Update the card with new scheduling
    const updatedCard = await this.cardRepository.update(request.cardId, {
      scheduling: rescheduleResult.newScheduling,
    });

    // Update deck's reviewsToday counter
    const deck = await this.deckRepository.findById(card.deckId);
    if (deck) {
      await this.deckRepository.update(card.deckId, {
        reviewsToday: deck.reviewsToday + 1,
      });
    }

    return {
      updatedCard,
      review,
    };
  }

  async getNextReviewDate(cardId: CardId): Promise<Date | null> {
    const card = await this.cardRepository.findById(cardId);
    return card?.scheduling.nextReviewDate || null;
  }

  async isCardDue(cardId: CardId): Promise<boolean> {
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      return false;
    }

    const now = new Date();
    return card.scheduling.nextReviewDate <= now;
  }

  async getDueCards(userId: UserId, deckId?: DeckId): Promise<readonly Card[]> {
    return this.cardRepository.findDueCards({
      userId: userId.value,
      deckId,
      includeNew: true,
    });
  }

  private mapResponseToRecallLevel(
    response: 'again' | 'hard' | 'good' | 'easy',
  ): RecallLevel {
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

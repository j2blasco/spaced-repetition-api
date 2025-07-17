import { INoSqlDatabase } from 'src/services/backend/no-sql-db/core/no-sql-db.interface';
import {
  Card,
  CardState,
  CardType,
  CreateCardRequest,
  DueCardsQuery,
  ICardRepository,
  UpdateCardRequest,
} from './card.interface';
import { ISpacedRepetitionSchedulerService } from 'src/services/spaced-repetition-algorithm/core/space-repetition-scheduler-service.interface';
import {
  AlgorithmType,
  CardSchedulingData,
} from 'src/services/spaced-repetition-algorithm/core/spaced-repetition-algorithm.interface';
import { DependencyInjector } from 'src/services/injector/injector';
import { noSqlDatabaseInjectionToken } from 'src/services/backend/no-sql-db/core/no-sql-db.injection-token';
import { spacedRepetitionSchedulerInjectionToken } from 'src/services/spaced-repetition-algorithm/core/space-repetition-scheduler-service.injection-token';
import { JsonObject } from '@j2blasco/ts-crud/types/utils/json-type';

// TODO: how can I enforce that this complies with JsonObject
type SerializedCard = Readonly<{
  readonly id: string;
  noteId: string;
  deckId: string;
  cardType: CardType;
  front: string;
  back: string;
  scheduling: JsonObject;
  createdAtIsoString: string;
  updatedAtIsoString: string;
}>;

export class CardRepository implements ICardRepository {
  private db: INoSqlDatabase;
  private schedulers: ISpacedRepetitionSchedulerService;

  constructor() {
    this.db = DependencyInjector.inject(noSqlDatabaseInjectionToken);
    this.schedulers = DependencyInjector.inject(
      spacedRepetitionSchedulerInjectionToken,
    );
  }

  private serializeCardData(card: Omit<Card, 'id'>): JsonObject {
    const scheduler = this.schedulers.getScheduler(
      card.scheduling.algorithmType,
    );
    const serializedScheduling = scheduler.serializeSchedulingData(
      card.scheduling,
    );

    return {
      noteId: card.noteId,
      deckId: card.deckId,
      cardType: card.cardType,
      front: card.front,
      back: card.back,
      scheduling: serializedScheduling,
      createdAtIsoString: card.createdAt.toISOString(),
      updatedAtIsoString: card.updatedAt.toISOString(),
    };
  }

  private deserializeCard(serializedCard: SerializedCard): Card {
    // First, we need to determine which scheduler to use based on the algorithm type
    const schedulingJson = serializedCard.scheduling as JsonObject & {
      algorithmType: AlgorithmType;
    };
    const scheduler = this.schedulers.getScheduler(
      schedulingJson.algorithmType,
    );
    const deserializedScheduling = scheduler.deserializeSchedulingData(
      serializedCard.scheduling,
    );

    return {
      id: serializedCard.id,
      noteId: serializedCard.noteId,
      deckId: serializedCard.deckId,
      cardType: serializedCard.cardType,
      front: serializedCard.front,
      back: serializedCard.back,
      scheduling: deserializedScheduling,
      createdAt: new Date(serializedCard.createdAtIsoString),
      updatedAt: new Date(serializedCard.updatedAtIsoString),
    };
  }

  private createInitialScheduling(
    algorithm: AlgorithmType,
  ): CardSchedulingData {
    const scheduler = this.schedulers.getScheduler(algorithm);
    return scheduler.initializeCard();
  }

  async create(request: CreateCardRequest): Promise<Card> {
    const now = new Date();
    const cardData: Omit<Card, 'id'> = {
      noteId: request.noteId,
      deckId: request.deckId,
      cardType: request.cardType,
      front: request.front,
      back: request.back,
      scheduling: this.createInitialScheduling(request.algorithm),
      createdAt: now,
      updatedAt: now,
    };

    const serializeCard = this.serializeCardData(cardData);

    const id = (
      await this.db.addToCollection(['cards'], serializeCard)
    ).unwrapOrThrow().id;

    const card: Card = {
      ...cardData,
      id: id,
    };

    return card;
  }

  async findById(id: string): Promise<Card | null> {
    // Get all cards and filter by id - not efficient but will work for now
    const result = await this.db.readCollection({ path: ['cards'] });

    try {
      const cards = result.unwrapOrThrow();
      const serializedCardData = cards.find((card) => card.id === id);

      if (!serializedCardData) {
        return null;
      }

      const serializedCard: SerializedCard = {
        id: serializedCardData.id,
        ...serializedCardData.data,
      } as SerializedCard;

      return this.deserializeCard(serializedCard);
    } catch {
      return null;
    }
  }
  async findByDeckId(deckId: string): Promise<readonly Card[]> {
    const result = await this.db.readCollection({ path: ['cards'] });

    try {
      const cards = result.unwrapOrThrow();
      const filteredCards = cards.filter(
        (cardData) => (cardData.data as JsonObject).deckId === deckId,
      );

      return filteredCards.map((cardData) => {
        const serializedCard: SerializedCard = {
          id: cardData.id,
          ...cardData.data,
        } as SerializedCard;
        return this.deserializeCard(serializedCard);
      });
    } catch {
      return [];
    }
  }

  async findByNoteId(noteId: string): Promise<readonly Card[]> {
    const result = await this.db.readCollection({ path: ['cards'] });

    try {
      const cards = result.unwrapOrThrow();
      const filteredCards = cards.filter(
        (cardData) => (cardData.data as JsonObject).noteId === noteId,
      );

      return filteredCards.map((cardData) => {
        const serializedCard: SerializedCard = {
          id: cardData.id,
          ...cardData.data,
        } as SerializedCard;
        return this.deserializeCard(serializedCard);
      });
    } catch {
      return [];
    }
  }

  async findDueCards(query: DueCardsQuery): Promise<readonly Card[]> {
    const result = await this.db.readCollection({ path: ['cards'] });

    try {
      const cards = result.unwrapOrThrow();
      const now = new Date();

      const dueCards = cards.filter((cardData) => {
        const data = cardData.data as JsonObject;
        // Check if card belongs to the deck (if deckId is specified)
        if (query.deckId && data.deckId !== query.deckId) {
          return false;
        }

        // Check if card is due for review
        const scheduling = data.scheduling as JsonObject;
        const nextReviewDate = new Date(scheduling.nextReviewDate as string);
        return nextReviewDate <= now;
      });

      const deserializedCards = dueCards.map((cardData) => {
        const serializedCard: SerializedCard = {
          id: cardData.id,
          ...cardData.data,
        } as SerializedCard;
        return this.deserializeCard(serializedCard);
      });

      // Apply maxCards limit if specified
      if (query.maxCards) {
        return deserializedCards.slice(0, query.maxCards);
      }

      return deserializedCards;
    } catch {
      return [];
    }
  }
  update(_id: string, _request: UpdateCardRequest): Promise<Card> {
    throw new Error('Method not implemented.');
  }
  delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  exists(_id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  getCardCountsByState(_deckId: string): Promise<Record<CardState, number>> {
    throw new Error('Method not implemented.');
  }
}

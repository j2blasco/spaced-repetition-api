import {
  Card,
  CreateCardRequest,
  DueCardsQuery,
  ICardRepository,
  UpdateCardRequest,
} from './card.interface';
import type { UserId } from 'src/core/user/user.interface';

export class CardRepository implements ICardRepository {
  constructor(private db: unknown) {}

  async create(_request: CreateCardRequest): Promise<Card> {
    throw new Error('Method not implemented.');
  }

  async findById(_id: string): Promise<Card | null> {
    throw new Error('Method not implemented.');
  }

  async findByUserId(_userId: UserId): Promise<readonly Card[]> {
    throw new Error('Method not implemented.');
  }

  async findByTags(
    _userId: UserId,
    _tags: readonly string[],
  ): Promise<readonly Card[]> {
    throw new Error('Method not implemented.');
  }

  async findDueCards(_query: DueCardsQuery): Promise<readonly Card[]> {
    throw new Error('Method not implemented.');
  }

  async update(_id: string, _request: UpdateCardRequest): Promise<Card> {
    throw new Error('Method not implemented.');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async exists(_id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async getCardCount(_userId: UserId): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async getCardCountsByTags(_userId: UserId): Promise<Record<string, number>> {
    throw new Error('Method not implemented.');
  }
}

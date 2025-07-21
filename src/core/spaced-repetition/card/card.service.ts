import { getCardRepository } from './get-card-repository';
import {
  CreateCardRequest,
  UpdateCardRequest,
  DueCardsQuery,
  Card,
} from './card.interface';
import { pipe } from '@j2blasco/ts-pipe';
import { andThen, catchError } from '@j2blasco/ts-result';

export interface CardServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class CardService {
  async createCard(
    request: CreateCardRequest,
  ): Promise<CardServiceResponse<Card>> {
    try {
      const cardRepo = getCardRepository();
      const result = await cardRepo.create(request);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen((card) => {
            resolve({ success: true, data: card });
            return result;
          }),
          catchError((_error) => {
            resolve({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create card',
              },
            });
            return result;
          }),
        );
      });
    } catch {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }

  async findCardById(id: string): Promise<CardServiceResponse<Card>> {
    try {
      const cardRepo = getCardRepository();
      const result = await cardRepo.findById(id);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen((card) => {
            resolve({ success: true, data: card });
            return result;
          }),
          catchError((error) => {
            if ('code' in error && error.code === 'not-found') {
              resolve({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Card not found',
                },
              });
            } else {
              resolve({
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Failed to find card',
                },
              });
            }
            return result;
          }),
        );
      });
    } catch {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }

  async findCardsByUserId(
    userId: string,
  ): Promise<CardServiceResponse<readonly Card[]>> {
    try {
      const cardRepo = getCardRepository();
      const result = await cardRepo.findByUserId(userId);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen((cards) => {
            resolve({ success: true, data: cards });
            return result;
          }),
          catchError((_error) => {
            resolve({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to find cards',
              },
            });
            return result;
          }),
        );
      });
    } catch {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }

  async findDueCards(
    query: DueCardsQuery,
  ): Promise<CardServiceResponse<readonly Card[]>> {
    try {
      const cardRepo = getCardRepository();
      const result = await cardRepo.findDueCards(query);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen((cards) => {
            resolve({ success: true, data: cards });
            return result;
          }),
          catchError((_error) => {
            resolve({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to find due cards',
              },
            });
            return result;
          }),
        );
      });
    } catch {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }

  async updateCard(
    id: string,
    request: UpdateCardRequest,
  ): Promise<CardServiceResponse<Card>> {
    try {
      const cardRepo = getCardRepository();
      const result = await cardRepo.update(id, request);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen((card) => {
            resolve({ success: true, data: card });
            return result;
          }),
          catchError((error) => {
            if ('code' in error && error.code === 'not-found') {
              resolve({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Card not found',
                },
              });
            } else {
              resolve({
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Failed to update card',
                },
              });
            }
            return result;
          }),
        );
      });
    } catch {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }

  async deleteCard(id: string): Promise<CardServiceResponse<void>> {
    try {
      const cardRepo = getCardRepository();
      const result = await cardRepo.delete(id);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen(() => {
            resolve({ success: true });
            return result;
          }),
          catchError((error) => {
            if ('code' in error && error.code === 'not-found') {
              resolve({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Card not found',
                },
              });
            } else {
              resolve({
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Failed to delete card',
                },
              });
            }
            return result;
          }),
        );
      });
    } catch {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }
}

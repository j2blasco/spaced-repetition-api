import { Express, Request, Response } from 'express';
import {
  CreateCardRequest,
  UpdateCardRequest,
  DueCardsQuery,
} from 'src/core/spaced-repetition/card/card.interface';
import { generateCardDataHash } from 'src/core/spaced-repetition/card/card-hash.util';
import {
  AlgorithmType,
  RecallLevel,
} from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';
import { DependencyInjector } from 'src/providers/injector/injector';
import { spacedRepetitionSchedulerInjectionToken } from 'src/providers/spaced-repetition-algorithm/core/space-repetition.injection-token';
import type { ReviewResponse } from 'src/core/spaced-repetition/review/review.interface';
import { restApiBaseRoute } from '../endpoints-route';
import { getCardRepository } from 'src/core/spaced-repetition/card/get-card-repository';
import { asyncPipe, pipe } from '@j2blasco/ts-pipe';
import {
  andThen,
  andThenAsync,
  catchError,
  resultSuccessVoid,
} from '@j2blasco/ts-result';

export const cardsEndpointRoute = `${restApiBaseRoute}/cards`;

async function handleListCards(req: Request, res: Response) {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'userId query parameter is required',
      },
    });
    return;
  }

  const cardRepo = getCardRepository();
  const result = await cardRepo.findByUserId(userId);

  pipe(
    result,
    andThen((cards) => {
      res.json(cards);
      return resultSuccessVoid();
    }),
    catchError((error) => {
      switch (error.code) {
        case 'unknown':
          res.status(500).json({
            error: error.data.message,
          });
          break;
        default:
          res.status(500).json({
            error: 'An unexpected error occurred',
          });
      }
      return resultSuccessVoid();
    }),
  );
}

async function handleCreateCard(req: Request, res: Response) {
  const createRequest: CreateCardRequest = {
    userId: req.body.userId,
    tags: req.body.tags,
    data: req.body.data,
    algorithmType: req.body.algorithmType || AlgorithmType.SM2,
  };

  const cardRepo = getCardRepository();
  const result = await cardRepo.create(createRequest);

  pipe(
    result,
    andThen((card) => {
      // Check if this card has been reviewed as failed (indicating it was a duplicate)
      const wasReviewed = card.scheduling.lastReviewDate !== null;
      const statusCode = wasReviewed ? 200 : 201;
      
      res.status(statusCode).json({
        ...card,
        wasExistingCard: wasReviewed,
        message: wasReviewed 
          ? 'Existing card found and reviewed as failed' 
          : 'New card created successfully'
      });
      return resultSuccessVoid();
    }),
    catchError((error) => {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create or review card',
        },
      });
      return resultSuccessVoid();
    }),
  );
}

async function handleGetCard(req: Request, res: Response) {
  const cardId = req.params.id;

  const cardRepo = getCardRepository();
  const result = await cardRepo.findById(cardId);

  pipe(
    result,
    andThen((card) => {
      res.json(card);
      return resultSuccessVoid();
    }),
    catchError((error) => {
      switch (error.code) {
        case 'not-found':
          res.status(404).json({
            error: 'Card not found',
          });
          break;
        case 'unknown':
          res.status(500).json({
            error: error.data.message,
          });
          break;
        default:
          res.status(500).json({
            error: 'An unexpected error occurred',
          });
      }
      return resultSuccessVoid();
    }),
  );
}

async function handleUpdateCard(req: Request, res: Response) {
  const cardId = req.params.id;
  const updateRequest: UpdateCardRequest = {
    tags: req.body.tags,
    data: req.body.data,
  };

  const cardRepo = getCardRepository();
  const result = await cardRepo.update(cardId, updateRequest);

  pipe(
    result,
    andThen((card) => {
      res.json(card);
      return resultSuccessVoid();
    }),
    catchError((error) => {
      switch (error.code) {
        case 'not-found':
          res.status(404).json({
            error: 'Card not found',
          });
          break;
        case 'unknown':
          res.status(500).json({
            error: error.data.message,
          });
          break;
        default:
          res.status(500).json({
            error: 'An unexpected error occurred',
          });
      }
      return resultSuccessVoid();
    }),
  );
}

async function handleDeleteCard(req: Request, res: Response) {
  const cardId = req.params.id;

  const cardRepo = getCardRepository();
  const result = await cardRepo.delete(cardId);

  pipe(
    result,
    andThen(() => {
      res.status(204).send();
      return resultSuccessVoid();
    }),
    catchError((error) => {
      switch (error.code) {
        case 'not-found':
          res.status(404).json({
            error: 'Card not found',
          });
          break;
        case 'unknown':
          res.status(500).json({
            error: error.data.message,
          });
          break;
        default:
          res.status(500).json({
            error: 'An unexpected error occurred',
          });
      }
      return resultSuccessVoid();
    }),
  );
}

async function handleGetDueCards(req: Request, res: Response) {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'userId query parameter is required',
      },
    });
    return;
  }

  const dueCardsQuery: DueCardsQuery = {
    userId,
    tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    limit: req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : undefined,
    currentDate: req.query.currentDate
      ? new Date(req.query.currentDate as string)
      : undefined,
  };

  const cardRepo = getCardRepository();
  const result = await cardRepo.findDueCards(dueCardsQuery);

  pipe(
    result,
    andThen((cards) => {
      res.json(cards);
      return resultSuccessVoid();
    }),
    catchError((error) => {
      switch (error.code) {
        case 'unknown':
          res.status(500).json({
            error: error.data.message,
          });
          break;
        default:
          res.status(500).json({
            error: 'An unexpected error occurred',
          });
      }
      return resultSuccessVoid();
    }),
  );
}

async function handleCheckCardExists(req: Request, res: Response) {
  const userId = req.query.userId as string;
  const data = req.body.data;
  const tags = req.body.tags;

  if (!userId || !data) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'userId and data are required',
      },
    });
    return;
  }

  const dataHash = generateCardDataHash({
    userId,
    data,
    tags,
  });

  const cardRepo = getCardRepository();
  const result = await cardRepo.findByDataHash(userId, dataHash);

  pipe(
    result,
    andThen((card) => {
      if (card) {
        res.json({
          exists: true,
          card,
          dataHash,
          message: 'Card exists. Creating a duplicate will review this card as failed.',
        });
      } else {
        res.json({
          exists: false,
          dataHash,
          message: 'Card does not exist. A new card will be created.',
        });
      }
      return resultSuccessVoid();
    }),
    catchError((error) => {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check card existence',
        },
      });
      return resultSuccessVoid();
    }),
  );
}

async function handleReviewCard(req: Request, res: Response) {
  const cardId = req.params.id;
  const reviewResponse = req.body.response as ReviewResponse;
  const reviewedAt = req.body.reviewedAt
    ? new Date(req.body.reviewedAt)
    : new Date();

  if (!reviewResponse) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'response field is required',
      },
    });
    return;
  }

  if (!['failed', 'good', 'easy'].includes(reviewResponse)) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'response must be one of: failed, good, easy',
      },
    });
    return;
  }

  const cardRepo = getCardRepository();
  const cardResult = await cardRepo.findById(cardId);

  const finalResult = await asyncPipe(
    cardResult,
    andThenAsync(async (card) => {
      const spacedRepetition = DependencyInjector.inject(
        spacedRepetitionSchedulerInjectionToken,
      );

      const scheduler = spacedRepetition.getScheduler(
        card.scheduling.algorithmType,
      );

      const recallLevel: RecallLevel =
        reviewResponse === 'failed'
          ? RecallLevel.HARD
          : reviewResponse === 'good'
            ? RecallLevel.MEDIUM
            : RecallLevel.EASY;

      const reviewResult = scheduler.reschedule({
        currentScheduling: card.scheduling,
        reviewResult: {
          recallLevel,
          reviewedAt,
        },
      });

      return cardRepo.update(cardId, {
        scheduling: reviewResult.newScheduling,
      });
    }),
  );

  pipe(
    finalResult,
    andThen((updatedCard) => {
      res.json({
        cardId,
        reviewResponse,
        reviewedAt: reviewedAt.toISOString(),
        newScheduling: updatedCard.scheduling,
        updatedCard,
      });
      return resultSuccessVoid();
    }),
    catchError((error) => {
      switch (error.code) {
        case 'not-found':
          res.status(404).json({
            error: 'Card not found',
          });
          break;
        case 'unknown':
          res.status(500).json({
            error: error.data.message,
          });
          break;
        default:
          res.status(500).json({
            error: 'An unexpected error occurred',
          });
      }
      return resultSuccessVoid();
    }),
  );
}

export function setupCardsEndpoints(app: Express) {
  app.post(`${cardsEndpointRoute}/check-exists`, (req: Request, res: Response) => {
    try {
      handleCheckCardExists(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/check-exists`, error);
    }
  });

  app.get(`${cardsEndpointRoute}/due`, (req: Request, res: Response) => {
    try {
      handleGetDueCards(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/due`, error);
    }
  });

  app.get(cardsEndpointRoute, (req: Request, res: Response) => {
    try {
      handleListCards(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}`, error);
    }
  });

  app.post(cardsEndpointRoute, (req: Request, res: Response) => {
    try {
      handleCreateCard(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}`, error);
    }
  });

  app.get(`${cardsEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleGetCard(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/:id`, error);
    }
  });

  app.put(`${cardsEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleUpdateCard(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/:id`, error);
    }
  });

  app.delete(`${cardsEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleDeleteCard(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/:id`, error);
    }
  });

  app.post(
    `${cardsEndpointRoute}/:id/review`,
    (req: Request, res: Response) => {
      try {
        handleReviewCard(req, res);
      } catch (error) {
        console.error(`Error in ${cardsEndpointRoute}/:id/review`, error);
      }
    },
  );
}

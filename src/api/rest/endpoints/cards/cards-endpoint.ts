import { Express, Request, Response } from 'express';
import { CardService } from 'src/core/spaced-repetition/card/card.service';
import {
  CreateCardRequest,
  UpdateCardRequest,
  DueCardsQuery,
} from 'src/core/spaced-repetition/card/card.interface';
import { AlgorithmType } from 'src/providers/spaced-repetition-algorithm/core/spaced-repetition-scheduler.interface';
import { DependencyInjector } from 'src/providers/injector/injector';
import { spacedRepetitionSchedulerInjectionToken } from 'src/providers/spaced-repetition-algorithm/core/space-repetition.injection-token';

export const cardsEndpointRoute = '/api/cards';

const cardService = new CardService();

// GET /api/cards - List user's cards (with filtering by tags, due status)
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

  const result = await cardService.findCardsByUserId(userId);

  if (result.success) {
    res.json(result.data);
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// POST /api/cards - Create new card
async function handleCreateCard(req: Request, res: Response) {
  const createRequest: CreateCardRequest = {
    userId: req.body.userId,
    tags: req.body.tags,
    data: req.body.data,
    algorithmType: req.body.algorithmType || AlgorithmType.SM2,
  };

  const result = await cardService.createCard(createRequest);

  if (result.success) {
    res.status(201).json(result.data);
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// GET /api/cards/:id - Get card details
async function handleGetCard(req: Request, res: Response) {
  const cardId = req.params.id;

  const result = await cardService.findCardById(cardId);

  if (result.success) {
    res.json(result.data);
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// PUT /api/cards/:id - Update card content
async function handleUpdateCard(req: Request, res: Response) {
  const cardId = req.params.id;
  const updateRequest: UpdateCardRequest = {
    tags: req.body.tags,
    data: req.body.data,
  };

  const result = await cardService.updateCard(cardId, updateRequest);

  if (result.success) {
    res.json(result.data);
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// DELETE /api/cards/:id - Delete card
async function handleDeleteCard(req: Request, res: Response) {
  const cardId = req.params.id;

  const result = await cardService.deleteCard(cardId);

  if (result.success) {
    res.status(204).send();
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// GET /api/cards/due - Get cards due for review
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

  const result = await cardService.findDueCards(dueCardsQuery);

  if (result.success) {
    res.json(result.data);
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// POST /api/cards/:id/review - Submit card review (updates scheduling)
async function handleReviewCard(req: Request, res: Response) {
  // This endpoint would need a review service that handles the spaced repetition logic
  // For now, return a placeholder response

  const spacedRepetition = DependencyInjector.inject(
    spacedRepetitionSchedulerInjectionToken,
  );

  // Get card

  // Get scheduler depending on the card algorithm
  const scheduler = spacedRepetition.getScheduler;

  // Review card using the

  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Review endpoint not yet implemented',
    },
  });
}

export function setupCardsEndpoints(app: Express) {
  // GET /api/cards/due (must be before /:id route)
  app.get(`${cardsEndpointRoute}/due`, (req: Request, res: Response) => {
    try {
      handleGetDueCards(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/due`, error);
    }
  });

  // GET /api/cards
  app.get(cardsEndpointRoute, (req: Request, res: Response) => {
    try {
      handleListCards(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}`, error);
    }
  });

  // POST /api/cards
  app.post(cardsEndpointRoute, (req: Request, res: Response) => {
    try {
      handleCreateCard(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}`, error);
    }
  });

  // GET /api/cards/:id
  app.get(`${cardsEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleGetCard(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/:id`, error);
    }
  });

  // PUT /api/cards/:id
  app.put(`${cardsEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleUpdateCard(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/:id`, error);
    }
  });

  // DELETE /api/cards/:id
  app.delete(`${cardsEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleDeleteCard(req, res);
    } catch (error) {
      console.error(`Error in ${cardsEndpointRoute}/:id`, error);
    }
  });

  // POST /api/cards/:id/review
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

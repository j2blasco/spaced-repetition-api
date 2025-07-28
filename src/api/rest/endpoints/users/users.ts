import { Express, Request, Response } from 'express';
import {
  CreateUserRequest,
  UpdateUserRequest,
} from 'src/core/user/user.interface';
import { restApiBaseRoute } from '../endpoints-route';
import { serializeUser } from 'src/core/user/user.repository';
import { getUserRepository } from 'src/core/user/get-user-repository';
import { pipe } from '@j2blasco/ts-pipe';
import {
  andThen,
  catchError,
  resultError,
  resultSuccessVoid,
} from '@j2blasco/ts-result';

export const usersEndpointRoute = `${restApiBaseRoute}/users`;

async function handleCreateUser(req: Request, res: Response) {
  const createRequest: CreateUserRequest = {
    preferences: req.body?.preferences,
  };

  const userRepo = getUserRepository();
  const result = await userRepo.create(createRequest);
  const user = result.unwrapOrThrow();

  res.status(201).json(serializeUser(user));
}

async function handleGetUser(req: Request, res: Response) {
  const userId = req.params.id;

  const userRepo = getUserRepository();
  const result = await userRepo.findById(userId);

  pipe(
    result,
    andThen((user) => {
      // TODO: findById should not return null
      if (user == null) {
        return resultError.withCode('not-found' as const);
      }
      if (user) {
        res.json(serializeUser(user));
      }
      return resultSuccessVoid();
    }),
    catchError((error) => {
      switch (error.code) {
        case 'not-found':
          res.status(404).json({
            error: 'User not found',
          });
          break;
        case 'unknown':
          res.status(500).json({
            error: error.data.message,
          });
          break;
        default:
          const _exhaustiveCheck: never = error;
      }
      return resultSuccessVoid();
    }),
  );
}

async function handleUpdateUser(req: Request, res: Response) {
  const userId = req.params.id;
  const updateRequest: UpdateUserRequest = {
    preferences: req.body.preferences,
  };

  const userRepo = getUserRepository();
  const result = await userRepo.update(userId, updateRequest);

  pipe(
    result,
    andThen((user) => {
      res.json(serializeUser(user));
      return resultSuccessVoid();
    }),
    catchError((error) => {
      switch (error.code) {
        case 'not-found':
          res.status(404).json({
            error: 'User not found',
          });
          break;
        case 'unknown':
          res.status(500).json({
            error: error.data.message,
          });
          break;
        default:
          const _exhaustiveCheck: never = error;
      }
      return resultSuccessVoid();
    }),
  );
}

async function handleDeleteUser(req: Request, res: Response) {
  const userId = req.params.id;

  const userRepo = getUserRepository();
  const result = await userRepo.delete(userId);

  pipe(
    result,
    andThen(() => {
      res.status(204).send();
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
          const _exhaustiveCheck: never = error.code;
      }
      return resultSuccessVoid();
    }),
  );
}

export function setupUsersEndpoints(app: Express) {
  app.post(usersEndpointRoute, (req: Request, res: Response) => {
    try {
      handleCreateUser(req, res);
    } catch (error) {
      console.error(`Error in ${usersEndpointRoute}`, error);
    }
  });

  app.get(`${usersEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleGetUser(req, res);
    } catch (error) {
      console.error(`Error in ${usersEndpointRoute}/:id`, error);
    }
  });

  app.put(`${usersEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleUpdateUser(req, res);
    } catch (error) {
      console.error(`Error in ${usersEndpointRoute}/:id`, error);
    }
  });

  app.delete(`${usersEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleDeleteUser(req, res);
    } catch (error) {
      console.error(`Error in ${usersEndpointRoute}/:id`, error);
    }
  });
}

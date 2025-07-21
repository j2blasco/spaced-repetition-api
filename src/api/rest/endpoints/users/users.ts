import { Express, Request, Response } from 'express';
import { UserService } from 'src/core/user/user.service';
import {
  CreateUserRequest,
  UpdateUserRequest,
} from 'src/core/user/user.interface';

export const usersEndpointRoute = '/api/users';

const userService = new UserService();

// POST /api/users - Create new user
async function handleCreateUser(req: Request, res: Response) {
  const createRequest: CreateUserRequest = {
    preferences: req.body.preferences,
  };

  const result = await userService.createUser(createRequest);

  if (result.success) {
    res.status(201).json(result.data);
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// GET /api/users/:id - Get user details
async function handleGetUser(req: Request, res: Response) {
  const userId = req.params.id;

  const result = await userService.findUserById(userId);

  if (result.success) {
    if (result.data === null) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    } else {
      res.json(result.data);
    }
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// PUT /api/users/:id - Update user preferences
async function handleUpdateUser(req: Request, res: Response) {
  const userId = req.params.id;
  const updateRequest: UpdateUserRequest = {
    preferences: req.body.preferences,
  };

  const result = await userService.updateUser(userId, updateRequest);

  if (result.success) {
    res.json(result.data);
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

// DELETE /api/users/:id - Delete user
async function handleDeleteUser(req: Request, res: Response) {
  const userId = req.params.id;

  const result = await userService.deleteUser(userId);

  if (result.success) {
    res.status(204).send();
  } else {
    const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({
      error: result.error,
    });
  }
}

export function setupUsersEndpoints(app: Express) {
  // POST /api/users
  app.post(usersEndpointRoute, (req: Request, res: Response) => {
    try {
      handleCreateUser(req, res);
    } catch (error) {
      console.error(`Error in ${usersEndpointRoute}`, error);
    }
  });

  // GET /api/users/:id
  app.get(`${usersEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleGetUser(req, res);
    } catch (error) {
      console.error(`Error in ${usersEndpointRoute}/:id`, error);
    }
  });

  // PUT /api/users/:id
  app.put(`${usersEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleUpdateUser(req, res);
    } catch (error) {
      console.error(`Error in ${usersEndpointRoute}/:id`, error);
    }
  });

  // DELETE /api/users/:id
  app.delete(`${usersEndpointRoute}/:id`, (req: Request, res: Response) => {
    try {
      handleDeleteUser(req, res);
    } catch (error) {
      console.error(`Error in ${usersEndpointRoute}/:id`, error);
    }
  });
}

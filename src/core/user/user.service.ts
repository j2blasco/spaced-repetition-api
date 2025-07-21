import { getUserRepository } from './get-user-repository';
import { CreateUserRequest, UpdateUserRequest, User } from './user.interface';
import { pipe } from '@j2blasco/ts-pipe';
import { andThen, catchError } from '@j2blasco/ts-result';

export interface UserServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class UserService {
  async createUser(
    request: CreateUserRequest,
  ): Promise<UserServiceResponse<User>> {
    try {
      const userRepo = getUserRepository();
      const result = await userRepo.create(request);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen((user) => {
            resolve({ success: true, data: user });
            return result;
          }),
          catchError((_error) => {
            resolve({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create user',
              },
            });
            return result;
          }),
        );
      });
    } catch (_error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }

  async findUserById(id: string): Promise<UserServiceResponse<User | null>> {
    try {
      const userRepo = getUserRepository();
      const result = await userRepo.findById(id);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen((user) => {
            resolve({ success: true, data: user });
            return result;
          }),
          catchError((_error) => {
            resolve({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to find user',
              },
            });
            return result;
          }),
        );
      });
    } catch (_error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }

  async updateUser(
    id: string,
    request: UpdateUserRequest,
  ): Promise<UserServiceResponse<User>> {
    try {
      const userRepo = getUserRepository();
      const result = await userRepo.update(id, request);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen((user) => {
            resolve({ success: true, data: user });
            return result;
          }),
          catchError((error) => {
            if ('code' in error && error.code === 'not-found') {
              resolve({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'User not found',
                },
              });
            } else {
              resolve({
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Failed to update user',
                },
              });
            }
            return result;
          }),
        );
      });
    } catch (_error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
    }
  }

  async deleteUser(id: string): Promise<UserServiceResponse<void>> {
    try {
      const userRepo = getUserRepository();
      const result = await userRepo.delete(id);

      return new Promise((resolve) => {
        pipe(
          result,
          andThen(() => {
            resolve({ success: true });
            return result;
          }),
          catchError((_error) => {
            resolve({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete user',
              },
            });
            return result;
          }),
        );
      });
    } catch (_error) {
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

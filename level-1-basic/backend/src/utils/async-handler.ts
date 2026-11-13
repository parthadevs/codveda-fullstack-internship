import { Request, Response, NextFunction } from 'express';

function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return async (req: T, res: U, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default asyncHandler;
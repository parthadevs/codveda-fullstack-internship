import { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/env';

class NotFoundMiddleware {
  public static handle(req: Request, _res: Response, next: NextFunction): void {
    const message = envConfig.nodeEnv === 'production'
      ? 'The requested resource was not found'
      : `Route ${req.method} ${req.originalUrl} not found`;

    const error = new Error(message) as Error & { statusCode: number; isOperational: boolean };
    error.statusCode = 404;
    error.isOperational = true;

    next(error);
  }
}

export default NotFoundMiddleware.handle;
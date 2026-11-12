
import { ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';
import { envConfig } from '../config/env';

type AppError = Error & {
  statusCode?: number;
  isOperational?: boolean;
  details?: unknown;
};

const errorHandler: ErrorRequestHandler = (error: AppError, _req, res, _next) => {
  const isOperational = error.isOperational === true;

  const statusCode =
    Number.isInteger(error.statusCode) &&
    error.statusCode! >= 400 &&
    error.statusCode! <= 599
      ? error.statusCode!
      : 500;

  const message =
    isOperational || envConfig.nodeEnv !== 'production'
      ? error.message || 'Internal Server Error'
      : 'Internal Server Error';

  if (isOperational) {
    logger.warn(`Operational error: ${message}`, {
      statusCode,
      details: error.details,
    });
  } else {
    logger.error(`Unexpected error: ${message}`, {
      statusCode,
      stack: error.stack,
    });
  }

  const response: Record<string, unknown> = {
    success: false,
    message,
    statusCode,
  };

  if (isOperational && error.details) {
    response.details = error.details;
  }

  if (envConfig.nodeEnv !== 'production' && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;

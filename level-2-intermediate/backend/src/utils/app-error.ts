class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  static unauthorized(message: string = "Unauthorized", details?: unknown): AppError {
    return new AppError(message, 401, details);
  }

  static forbidden(message: string = "Forbidden", details?: unknown): AppError {
    return new AppError(message, 403, details);
  }

  static notFound(message: string = "Resource not found", details?: unknown): AppError {
    return new AppError(message, 404, details);
  }

  static conflict(message: string = "Resource already exists", details?: unknown): AppError {
    return new AppError(message, 409, details);
  }

  static unprocessable(message: string = "Validation failed", details?: unknown): AppError {
    return new AppError(message, 422, details);
  }

  static tooManyRequests(
    message: string = "Too many requests, please try again later",
    details?: unknown,
  ): AppError {
    return new AppError(message, 429, details);
  }

  static internal(message: string = "Internal server error", details?: unknown): AppError {
    return new AppError(message, 500, details);
  }

  static serviceUnavailable(
    message: string = "Service unavailable",
    details?: unknown,
  ): AppError {
    return new AppError(message, 503, details);
  }
}

export default AppError;
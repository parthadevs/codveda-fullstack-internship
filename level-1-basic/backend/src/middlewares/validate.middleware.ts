import { Request, Response, NextFunction } from 'express';
import type { ZodError, ZodSchema } from 'zod';
import { logger } from '@utils/logger';

type ValidationSource = 'body' | 'query' | 'params';
type FieldError = { field: string; message: string };

const SOURCES: readonly ValidationSource[] = ['body', 'query', 'params'];

function toFieldErrors(issues: ZodError['issues'], prefix = ''): FieldError[] {
  return issues.map((issue) => ({
    field: `${prefix}${issue.path.join('.')}`,
    message: issue.message,
  }));
}

function sendValidationError(res: Response, errors: FieldError[]): void {
  res.status(422).json({
    success: false,
    message: 'Validation failed',
    statusCode: 422,
    errors,
  });
}

class ValidateMiddleware {
  public static validate<T extends ZodSchema>(
    schema: T,
    source: ValidationSource = 'body',
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
          const errors = toFieldErrors(result.error.issues);
          logger.warn('Validation failed', { errors, source });
          sendValidationError(res, errors);
          return;
        }

        req[source] = result.data;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  public static validateMultiple(
    schemas: Partial<Record<ValidationSource, ZodSchema>>,
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const errors: FieldError[] = [];

        for (const source of SOURCES) {
          const schema = schemas[source];
          if (!schema) continue;

          const result = schema.safeParse(req[source]);
          if (result.success) {
            req[source] = result.data;
          } else {
            errors.push(...toFieldErrors(result.error.issues, `${source}.`));
          }
        }

        if (errors.length > 0) {
          logger.warn('Validation failed', { errors });
          sendValidationError(res, errors);
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

export const validate = ValidateMiddleware.validate;
export default validate;
export { ValidateMiddleware };
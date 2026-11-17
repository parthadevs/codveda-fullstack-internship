import { Request, Response, NextFunction } from "express";
import AppError from "../utils/app-error";

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized("Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden("Insufficient permissions"));
      return;
    }

    next();
  };
}
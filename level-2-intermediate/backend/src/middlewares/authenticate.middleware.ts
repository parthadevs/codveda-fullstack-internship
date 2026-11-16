import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: "Invalid or expired token", statusCode: 401 });
    return;
  }

  req.user = payload as { userId: string };
  next();
}
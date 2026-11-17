import { Request, Response, NextFunction } from "express";
import { envConfig } from "../config/env";

const WINDOW_MS = envConfig.getNumber("RATE_LIMIT_WINDOW_MS", 60 * 1000);
const MAX_REQ = envConfig.getNumber("RATE_LIMIT_MAX_REQUESTS", 100);
const AUTH_MAX_REQ = envConfig.getNumber("AUTH_RATE_LIMIT_MAX_REQUESTS", 5);

interface HitRecord {
  count: number;
  resetAt: number;
}

function limiter(max: number, windowMs: number) {
  const hits = new Map<string, HitRecord>();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of hits) {
      if (now >= rec.resetAt) hits.delete(ip);
    }
  }, windowMs);
  timer.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    let rec = hits.get(ip);

    if (!rec || now >= rec.resetAt) {
      rec = { count: 1, resetAt: now + windowMs };
      hits.set(ip, rec);
    } else {
      rec.count += 1;
    }

    const remaining = Math.max(0, max - rec.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(rec.resetAt / 1000)));

    if (rec.count > max) {
      const retryAfter = Math.max(1, Math.ceil((rec.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
        statusCode: 429,
      });
      return;
    }

    next();
  };
}

export const rateLimit = limiter(MAX_REQ, WINDOW_MS);
export const authRateLimit = limiter(AUTH_MAX_REQ, WINDOW_MS);
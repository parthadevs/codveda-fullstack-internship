import jwt from "jsonwebtoken";
import { envConfig } from "../config/env";

export function signToken(payload: object, expiresIn?: string): string {
  return jwt.sign(payload, envConfig.jwtSecret, { expiresIn: expiresIn || envConfig.jwtExpiresIn } as any);
}

export function verifyToken(token: string): any | null {
  try {
    return jwt.verify(token, envConfig.jwtSecret);
  } catch {
    return null;
  }
}
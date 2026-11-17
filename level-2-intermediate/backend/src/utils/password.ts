import { hash, compare } from "bcryptjs";
import { envConfig } from '../config/env'

const SALT_ROUNDS = Number(envConfig.soltRounds) ||  12;
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}
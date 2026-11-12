import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

class EnvConfig {
  private static instance: EnvConfig;

  private constructor() {
    const envPath = resolve(process.cwd(), ".env");

    if (!existsSync(envPath)) {
      console.warn(".env file not found in the root directory.");
    } else {
      config({ path: envPath });
    }
  }

  public static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  public get(key: string, defaultValue = ""): string {
    return process.env[key] ?? defaultValue;
  }

  public getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const num = Number(value);
    return Number.isNaN(num) ? defaultValue : num;
  }

  public getBoolean(key: string, defaultValue = false): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value === "true" || value === "1" || value === "yes";
  }
  
  // Getters for configuration properties
  public get corsOrigin(): string | string[] {
    const origin = this.get("CORS_ORIGIN", "*");
    if (origin === "*") {
      return "*";
    }
    return origin.split(",").map((item) => item.trim());
  }

  public get port(): number {
    return this.getNumber("PORT", 3000);
  }

  public get nodeEnv(): string {
    return this.get("NODE_ENV", "development");
  }

  public get databaseUrl(): string {
    return this.get(
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/codveda",
    );
  }

  public get jwtSecret(): string {
    return this.get("JWT_SECRET", "default-secret-change-in-production");
  }

  public get jwtExpiresIn(): string {
    return this.get("JWT_EXPIRES_IN", "7d");
  }

  public get apiPrefix(): string {
    return this.get("API_PREFIX", "/api/v1");
  }

  public get logLevel(): string {
    return this.get("LOG_LEVEL", "info");
  }
}

export const envConfig = EnvConfig.getInstance();
export default envConfig;
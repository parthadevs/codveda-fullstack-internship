import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../utils/logger';
import envConfig from './env';

class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient | null = null;

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getClient(): PrismaClient {
    if (this.prisma) {
      return this.prisma;
    }

    const adapter = new PrismaPg({
      connectionString: envConfig.databaseUrl,
    });

    this.prisma = new PrismaClient({
      adapter,
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'query', emit: 'event' },
      ],
      errorFormat: "minimal",
    });

    ;(this.prisma as any).$on('error', (e: any) => {
      logger.error('Prisma error', e);
    });

    ;(this.prisma as any).$on('warn', (e: any) => {
      logger.warn('Prisma warning', e);
    });

    ;(this.prisma as any).$on('info', (e: any) => {
      logger.info('Prisma info', e);
    });

    if (envConfig.nodeEnv === 'development') {
      ;(this.prisma as any).$on('query', (e: any) => {
        logger.debug('Prisma query', { query: e.query, params: e.params, duration: e.duration });
      });
    }

    return this.prisma;
  }

  public async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
  }
}

export const databaseManager = DatabaseManager.getInstance();
export const prisma = databaseManager.getClient();
export default prisma;
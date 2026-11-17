
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { envConfig } from './config/env';
import { logger } from './utils/logger';
import { databaseManager } from './config/database';
import errorMiddleware from './middlewares/error.middleware';
import { appRoutes } from './routes';
import notFoundMiddleware from './middlewares/not-found.middleware';

class App {
  public readonly app: Application;

  constructor() {
    this.app = express();
    this.middleware();
    this.mainRoutes();
    this.errorHandler();
  }

  private middleware(): void {
    // security
    this.app.use(helmet({
      contentSecurityPolicy: envConfig.nodeEnv === 'production' ? undefined : false,
      hsts: envConfig.nodeEnv === 'production' ? undefined : false,
    }));

    // CORS
    this.app.use(cors({
      origin: envConfig.nodeEnv === 'production'
        ? (envConfig.corsOrigin || '*')
        : '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Cookie parsing
    this.app.use(cookieParser());

    // body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // logging
    this.app.use((req: Request, res: Response, next) => {
      const start = process.hrtime.bigint();

      res.on('finish', () => {
        const duration = Number(process.hrtime.bigint() - start) / 1e6;
        const { method, originalUrl } = req;
        const { statusCode } = res;

        if (statusCode >= 400) {
          logger.warn(`${method} ${originalUrl} - ${duration.toFixed(2)}ms`);
        } else {
          logger.info(`${method} ${originalUrl} - ${duration.toFixed(2)}ms`);
        }
      });

      next();
    });

    // trust proxy for production
    if (envConfig.nodeEnv === 'production') {
      this.app.set('trust proxy', 1);
    }
  }

  private mainRoutes(): void {
    this.app.use(appRoutes);
  }

  private errorHandler(): void {
    this.app.use(notFoundMiddleware);
    this.app.use(errorMiddleware);
  }

  public listen(): void {
    const port = envConfig.port;

    this.app.listen(port, () => {
      logger.info(`Server running on port ${port}`, {
        environment: envConfig.nodeEnv,
        apiPrefix: envConfig.apiPrefix,
      });
    });
  }


  public async shutdown(): Promise<void> {
    try {
      await databaseManager.disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error during database disconnect', { error });
    }
  }
}

export default App;
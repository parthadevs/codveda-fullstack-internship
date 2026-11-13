
import { Router, Request, Response } from 'express';
import { envConfig } from './config/env';
import productRoutes from './modules/products/product.routes';


class AppRoutes {
  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const prefix = envConfig.apiPrefix;

    // health check
    this.router.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        environment: envConfig.nodeEnv,
      });
    });

    this.router.use(`${prefix}/products`, productRoutes);

    // undefined routes
    this.router.all('*', (_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        statusCode: 404,
      });
    });
  }
}

export const appRoutes = new AppRoutes().router;
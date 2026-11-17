import { Router, Request, Response } from "express";
import { envConfig } from "./config/env";
import { userRoutes } from "./modules/users/user.routes";
import { productRoutes } from "./modules/products/product.routes";
import { categoryRoutes } from "./modules/categories/category.routes";
import { authRoutes } from "./modules/auth/auth.routes";

class AppRoutes {
  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const prefix = envConfig.apiPrefix;

    // Health check
    this.router.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
        environment: envConfig.nodeEnv,
      });
    });

    // Auth routes (no prefix)
    this.router.use(`${prefix}/auth`, authRoutes);

    // API routes
    this.router.use(`${prefix}/users`, userRoutes);
    this.router.use(`${prefix}/products`, productRoutes);
    this.router.use(`${prefix}/categories`, categoryRoutes);

    // Undefined routes
    this.router.all("*", (_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
        statusCode: 404,
      });
    });
  }
}

export const appRoutes = new AppRoutes().router;
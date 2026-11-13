import App from "./app";
import { logger } from './utils/logger';
import { databaseManager } from './config/database';

class Server {
  private app: App | null = null;
  private isShuttingDown = false;

  public async start(): Promise<void> {
    try {
      logger.info("Connecting to database...");
      const prisma = databaseManager.getClient();
      await prisma.$connect();
      logger.info("DB connected.");

      this.app = new App();
      this.setupGracefulShutdown();

      this.app.listen();
    } catch (error) {
      logger.error("Failed to start server", { error });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];

    signals.forEach((signal) => {
      process.on(signal, () => {
        void this.gracefulShutdown(0);
      });
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", { error });
      void this.gracefulShutdown(1);
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection", { reason });
      void this.gracefulShutdown(1);
    });
  }

  private async gracefulShutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn("Shutdown already in progress...");
      return;
    }

    this.isShuttingDown = true;
    logger.info("Graceful shutdown started...");

    try {
      if (this.app) {
        await this.app.shutdown();
      }

      logger.info("Server shutdown completed.");
      process.exit(exitCode);
    } catch (error) {
      logger.error("Error during shutdown", { error });
      process.exit(1);
    }
  }
}

// server start from here
const server = new Server();
server.start();


import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import express from 'express';
import { appRoutes } from '../src/routes';

describe('Health Check', () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(appRoutes);

    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });

    const address = server.address();
    if (address && typeof address === 'object') {
      baseUrl = `http://localhost:${address.port}`;
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should return 200 status on /health endpoint', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Server is healthy');
    expect(body.timestamp).toBeDefined();
    expect(body.environment).toBeDefined();
  });

  it('should return 404 for undefined routes', async () => {
    const response = await fetch(`${baseUrl}/api/v1/nonexistent`);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Route not found');
  });
});
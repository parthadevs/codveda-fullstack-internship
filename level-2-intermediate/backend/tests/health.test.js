"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const routes_1 = require("../src/routes");
(0, vitest_1.describe)('Health Check', () => {
    let server;
    let baseUrl;
    (0, vitest_1.beforeAll)(async () => {
        const app = (0, express_1.default)();
        app.use(routes_1.appRoutes);
        server = (0, http_1.createServer)(app);
        await new Promise((resolve) => {
            server.listen(0, () => resolve());
        });
        const address = server.address();
        if (address && typeof address === 'object') {
            baseUrl = `http://localhost:${address.port}`;
        }
    });
    (0, vitest_1.afterAll)(async () => {
        await new Promise((resolve) => {
            server.close(() => resolve());
        });
    });
    (0, vitest_1.it)('should return 200 status on /health endpoint', async () => {
        const response = await fetch(`${baseUrl}/health`);
        const body = (await response.json());
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(body.success).toBe(true);
        (0, vitest_1.expect)(body.message).toBe('Server is healthy');
        (0, vitest_1.expect)(body.timestamp).toBeDefined();
        (0, vitest_1.expect)(body.environment).toBeDefined();
    });
    (0, vitest_1.it)('should return 404 for undefined routes', async () => {
        const response = await fetch(`${baseUrl}/api/v1/nonexistent`);
        const body = (await response.json());
        (0, vitest_1.expect)(response.status).toBe(404);
        (0, vitest_1.expect)(body.success).toBe(false);
        (0, vitest_1.expect)(body.message).toBe('Route not found');
    });
});
//# sourceMappingURL=health.test.js.map
import { defineConfig } from 'prisma/config';
 import { envConfig } from './src/config/env';

export default defineConfig({
  datasource: {
    url: envConfig.databaseUrl || 'postgresql://postgres:password@localhost:5432/codveda',
  },
});
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/*/infrastructure/repository/postgres/schema.ts',
  out: './src/shared/infrastructure/database/migrations',
});

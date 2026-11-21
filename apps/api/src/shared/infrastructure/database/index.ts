import { drizzle } from 'drizzle-orm/node-postgres';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('./migrations', import.meta.url));

export const createDatabase = (url: string) => {
  const pool = new Pool({ connectionString: url, max: 10, connectionTimeoutMillis: 3000 });
  pool.on('error', (error) => console.error('Idle database connection failed', error.message));
  return { db: drizzle(pool), close: () => pool.end() };
};

export type Database = ReturnType<typeof createDatabase>['db'];

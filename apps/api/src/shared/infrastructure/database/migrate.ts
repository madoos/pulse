import { MIGRATIONS_FOLDER, createDatabase } from '@shared/infrastructure/database';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { z } from 'zod';

const { DATABASE_URL } = z.object({ DATABASE_URL: z.url() }).parse(process.env);
const { db, close } = createDatabase(DATABASE_URL);

try {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  console.log('Migrations applied');
} finally {
  await close();
}

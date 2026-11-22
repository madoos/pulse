import { createInitialUserSeed } from '@auth/infrastructure/seed';
import {
  BUSINESS_DATA_FOLDER,
  MIGRATIONS_FOLDER,
  createDatabase,
} from '@shared/infrastructure/database';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { z } from 'zod';
import { createBusinessDataSeed, createSupportDocumentsSeed } from './business-data';
import { runSeeds } from './seeds';

const env = z
  .object({
    DATABASE_URL: z.url(),
    SEED_USER_EMAIL: z.email(),
    SEED_USER_PASSWORD: z.string().min(12),
  })
  .parse(process.env);

const { db, close } = createDatabase(env.DATABASE_URL);

try {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  console.log('Migrations applied');

  const applied = await runSeeds(db, [
    createInitialUserSeed({ email: env.SEED_USER_EMAIL, password: env.SEED_USER_PASSWORD }),
    createBusinessDataSeed(BUSINESS_DATA_FOLDER),
    createSupportDocumentsSeed(BUSINESS_DATA_FOLDER),
  ]);
  console.log(applied.length ? `Seeds applied: ${applied.join(', ')}` : 'No pending seeds');
} finally {
  await close();
}

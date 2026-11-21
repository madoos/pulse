import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { MIGRATIONS_FOLDER, createDatabase } from '.';

export const startTestDatabase = async () => {
  const container = await new PostgreSqlContainer('pgvector/pgvector:0.8.7-pg18-trixie').start();
  const database = createDatabase(container.getConnectionUri());
  await migrate(database.db, { migrationsFolder: MIGRATIONS_FOLDER });
  return {
    db: database.db,
    stop: async () => {
      await database.close();
      await container.stop();
    },
  };
};

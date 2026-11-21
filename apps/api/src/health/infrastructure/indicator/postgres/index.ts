import type { HealthIndicator } from '@health/domain/HealthIndicator';
import type { Database } from '@shared/infrastructure/database';
import { sql } from 'drizzle-orm';

export const createPostgresHealthIndicator = (db: Database): HealthIndicator => ({
  name: 'database',
  isUp: async () => {
    try {
      await db.execute(sql`select 1`);
      return true;
    } catch {
      return false;
    }
  },
});

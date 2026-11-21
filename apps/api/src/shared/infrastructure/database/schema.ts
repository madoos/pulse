import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const seeds = pgTable('seeds', {
  id: text('id').primaryKey(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
});

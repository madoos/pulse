import { eq } from 'drizzle-orm';
import type { Database } from '.';
import { seeds } from './schema';

export type Seed = {
  id: string;
  run: (db: Database) => Promise<void>;
};

export const runSeeds = async (db: Database, pending: Seed[]): Promise<string[]> => {
  const applied: string[] = [];
  for (const seed of pending) {
    const [done] = await db.select().from(seeds).where(eq(seeds.id, seed.id));
    if (done) continue;

    await seed.run(db);
    await db.insert(seeds).values({ id: seed.id });
    applied.push(seed.id);
  }
  return applied;
};

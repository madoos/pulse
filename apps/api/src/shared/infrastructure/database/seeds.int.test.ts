import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '.';
import { runSeeds, type Seed } from './seeds';
import { startTestDatabase } from './testing';

describe('runSeeds', () => {
  let database: Awaited<ReturnType<typeof startTestDatabase>>;

  beforeAll(async () => {
    database = await startTestDatabase();
  }, 120_000);

  afterAll(() => database?.stop());

  const seed = (
    id: string,
  ): Seed & { run: ReturnType<typeof vi.fn<(db: Database) => Promise<void>>> } => ({
    id,
    run: vi.fn(async () => {}),
  });

  it('applies each seed once, in order, and remembers it', async () => {
    const first = seed('test/0001-first');
    const second = seed('test/0002-second');

    expect(await runSeeds(database.db, [first, second])).toEqual([
      'test/0001-first',
      'test/0002-second',
    ]);
    expect(await runSeeds(database.db, [first, second])).toEqual([]);

    expect(first.run).toHaveBeenCalledOnce();
    expect(second.run).toHaveBeenCalledOnce();
  });

  it('does not record a seed that fails, so it runs again next time', async () => {
    const failing: Seed = {
      id: 'test/0003-failing',
      run: async () => {
        throw new Error('boom');
      },
    };

    await expect(runSeeds(database.db, [failing])).rejects.toThrow('boom');

    const retried = seed('test/0003-failing');
    expect(await runSeeds(database.db, [retried])).toEqual(['test/0003-failing']);
  });
});

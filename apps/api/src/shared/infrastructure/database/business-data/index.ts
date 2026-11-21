import {
  advisoryFirms,
  autonomousCommunities,
  provinces,
  specialties,
} from '@advisory-firms/infrastructure/repository/postgres/schema';
import { monthlyMetrics } from '@performance/infrastructure/repository/postgres/schema';
import { parse } from 'csv-parse/sync';
import { getTableColumns } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database } from '..';
import type { Seed } from '../seeds';

const BATCH_SIZE = 500;

const FILES: [string, PgTable][] = [
  ['autonomous-communities.csv', autonomousCommunities],
  ['provinces.csv', provinces],
  ['specialties.csv', specialties],
  ['advisory-firms.csv', advisoryFirms],
  ['monthly-metrics.csv', monthlyMetrics],
];

const readRows = (path: string, table: PgTable) => {
  const columns = new Map(
    Object.entries(getTableColumns(table)).map(([key, column]) => [column.name, { key, column }]),
  );
  const records: Record<string, string>[] = parse(readFileSync(path, 'utf8'), { columns: true });
  return records.map((record) =>
    Object.fromEntries(
      Object.entries(record).map(([name, value]) => {
        const target = columns.get(name);
        if (!target) throw new Error(`Unknown column ${name} in ${path}`);
        return [target.key, target.column.dataType === 'number' ? Number(value) : value];
      }),
    ),
  );
};

export const loadBusinessData = async (db: Database, folder: string) => {
  await db.transaction(async (tx) => {
    for (const [file, table] of FILES) {
      const rows = readRows(join(folder, file), table);
      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        await tx.insert(table).values(rows.slice(start, start + BATCH_SIZE));
      }
      console.log(`${file}: ${rows.length} rows loaded`);
    }
  });
};

export const createBusinessDataSeed = (folder: string): Seed => ({
  id: 'business-data/0001-initial-load',
  run: (db) => loadBusinessData(db, folder),
});

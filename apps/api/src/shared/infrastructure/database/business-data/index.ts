import {
  advisoryFirms,
  autonomousCommunities,
  provinces,
  specialties,
} from '@advisory-firms/infrastructure/repository/postgres/schema';
import { monthlyMetrics } from '@performance/infrastructure/repository/postgres/schema';
import { supportDocuments } from '@support-assistant/infrastructure/repository/postgres/schema';
import { parse } from 'csv-parse/sync';
import { getTableColumns } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database } from '..';
import type { Seed } from '../seeds';

const BATCH_SIZE = 500;

type DataFile = [string, PgTable];

const INITIAL_LOAD: DataFile[] = [
  ['autonomous-communities.csv', autonomousCommunities],
  ['provinces.csv', provinces],
  ['specialties.csv', specialties],
  ['advisory-firms.csv', advisoryFirms],
  ['monthly-metrics.csv', monthlyMetrics],
];

/** The support documents, with the embeddings the ingestion computed (ADR-0023). */
const SUPPORT_DOCUMENTS: DataFile[] = [['support-documents.csv', supportDocuments]];

/** Arrays and vectors are written as JSON in the files. */
const valueOf = (column: { dataType: string; columnType: string }, value: string) => {
  if (column.dataType === 'number') return Number(value);
  if (column.columnType === 'PgArray' || column.columnType === 'PgVector') return JSON.parse(value);
  return value;
};

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
        return [target.key, valueOf(target.column, value)];
      }),
    ),
  );
};

const loadFiles = async (db: Database, folder: string, files: DataFile[]) => {
  await db.transaction(async (tx) => {
    for (const [file, table] of files) {
      const rows = readRows(join(folder, file), table);
      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        await tx.insert(table).values(rows.slice(start, start + BATCH_SIZE));
      }
      console.log(`${file}: ${rows.length} rows loaded`);
    }
  });
};

export const loadBusinessData = (db: Database, folder: string) =>
  loadFiles(db, folder, INITIAL_LOAD);

export const loadSupportDocuments = (db: Database, folder: string) =>
  loadFiles(db, folder, SUPPORT_DOCUMENTS);

export const createBusinessDataSeed = (folder: string): Seed => ({
  id: 'business-data/0001-initial-load',
  run: (db) => loadBusinessData(db, folder),
});

/** A seed of its own, so an environment already loaded only receives the new documents. */
export const createSupportDocumentsSeed = (folder: string): Seed => ({
  id: 'business-data/0002-support-documents',
  run: (db) => loadSupportDocuments(db, folder),
});

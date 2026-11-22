/**
 * Simulates the ingestion of the support documents (ADR-0023): reads the source file, computes
 * the embedding of each document with the model the API uses for questions, and writes the data
 * file that the business data seed loads.
 *
 *   pnpm --filter @pulse/api ingest:support <source.jsonl>
 */
import { BUSINESS_DATA_FOLDER } from '@shared/infrastructure/database';
import { createTransformersEmbedder } from '@support-assistant/infrastructure/embedder/transformers';
import { stringify } from 'csv-stringify/sync';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const SourceSchema = z.object({
  doc_id: z.string().regex(/^SUP-\d+$/),
  asesoria_id: z.number().int().positive(),
  fecha: z.iso.date(),
  tipo: z.string(),
  categoria: z.string(),
  prioridad: z.string(),
  estado: z.string(),
  titulo: z.string(),
  texto: z.string(),
  tags: z.array(z.string()),
});

const BATCH_SIZE = 32;

const [source] = process.argv.slice(2);
if (!source) throw new Error('Usage: ingest-support-documents <source.jsonl>');

const documents = readFileSync(source, 'utf8')
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => SourceSchema.parse(JSON.parse(line)));

const embedder = createTransformersEmbedder();
const rows: Record<string, string>[] = [];
for (let start = 0; start < documents.length; start += BATCH_SIZE) {
  const batch = documents.slice(start, start + BATCH_SIZE);
  const content = batch.map((doc) => `${doc.titulo}. ${doc.texto}`);
  const embeddings = await embedder.embedPassages(content);
  batch.forEach((doc, index) =>
    rows.push({
      id: doc.doc_id,
      firm_id: String(doc.asesoria_id),
      date: doc.fecha,
      type: doc.tipo,
      category: doc.categoria,
      priority: doc.prioridad,
      status: doc.estado,
      title: doc.titulo,
      text: doc.texto,
      tags: JSON.stringify(doc.tags),
      content_hash: createHash('sha256').update(content[index]!).digest('hex'),
      // Six decimals are far below what changes the order of a search, and halve the file.
      embedding: JSON.stringify(embeddings[index]!.map((value) => Number(value.toFixed(6)))),
    }),
  );
  console.log(`${Math.min(start + BATCH_SIZE, documents.length)}/${documents.length} documents`);
}

const target = join(BUSINESS_DATA_FOLDER, 'support-documents.csv');
writeFileSync(target, stringify(rows, { header: true }));
console.log(`${rows.length} documents written to ${target}`);

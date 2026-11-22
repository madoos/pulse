import { users } from '@auth/infrastructure/repository/postgres/schema';
import { BUSINESS_DATA_FOLDER } from '@shared/infrastructure/database';
import {
  loadBusinessData,
  loadSupportDocuments,
} from '@shared/infrastructure/database/business-data';
import { startTestDatabase } from '@shared/infrastructure/database/testing';
import { TOP_K } from '@support-assistant/domain/Retrieval';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPostgresConversationLog, createPostgresSupportDocumentRepository } from '.';
import { messages, steps, supportDocuments } from './schema';

describe('Postgres support assistant', () => {
  let database: Awaited<ReturnType<typeof startTestDatabase>>;
  let repository: ReturnType<typeof createPostgresSupportDocumentRepository>;
  let log: ReturnType<typeof createPostgresConversationLog>;
  let userId: string;

  /** The embedding the ingestion computed for a document. */
  const embeddingOf = async (id: string) => {
    const [row] = await database.db
      .select({ embedding: supportDocuments.embedding })
      .from(supportDocuments)
      .where(eq(supportDocuments.id, id));
    return row!.embedding;
  };

  /** The first document of a firm, to search with its embedding. */
  const firstDocumentOf = async (firmId: number) => {
    const [row] = await database.db
      .select({ id: supportDocuments.id })
      .from(supportDocuments)
      .where(eq(supportDocuments.firmId, firmId))
      .orderBy(supportDocuments.id)
      .limit(1);
    return row!.id;
  };

  beforeAll(async () => {
    database = await startTestDatabase();
    await loadBusinessData(database.db, BUSINESS_DATA_FOLDER);
    await loadSupportDocuments(database.db, BUSINESS_DATA_FOLDER);
    repository = createPostgresSupportDocumentRepository(database.db);
    log = createPostgresConversationLog(database.db);
    const [user] = await database.db
      .insert(users)
      .values({ email: 'a@pulse.com', passwordHash: 'x' })
      .returning();
    userId = user!.id;
  }, 180_000);

  afterAll(() => database?.stop());

  describe('support documents', () => {
    it('loads every document of the ingestion with its embedding', async () => {
      const rows = await database.db.select({ id: supportDocuments.id }).from(supportDocuments);
      const embedding = await embeddingOf('SUP-0001');

      expect(rows).toHaveLength(330);
      expect(embedding).toHaveLength(384);
    });

    it('never returns a document of another firm, even the one searched with', async () => {
      // The embedding of a document of firm 2 is as similar as it gets to that document.
      const document = await firstDocumentOf(2);
      const embedding = await embeddingOf(document);

      const found = await repository.search(1, { embedding }, TOP_K);

      expect(found.length).toBeGreaterThan(0);
      expect(found.every((f) => f.document.firmId === 1)).toBe(true);
      expect(found.map((f) => f.document.id)).not.toContain(document);
    });

    it('returns at most the top k, the most similar first', async () => {
      const document = await firstDocumentOf(1);

      const found = await repository.search(1, { embedding: await embeddingOf(document) }, 3);

      expect(found).toHaveLength(3);
      expect(found[0]).toMatchObject({ document: { id: document } });
      expect(found[0]!.similarity).toBeCloseTo(1, 3);
      const similarities = found.map((f) => f.similarity);
      expect(similarities).toEqual([...similarities].sort((a, b) => b - a));
    });

    it('narrows by dates, category and status', async () => {
      const embedding = await embeddingOf(await firstDocumentOf(1));
      const range = (await repository.dateRange(1))!;
      const all = await repository.search(1, { embedding }, TOP_K);
      const middle = all.map((f) => f.document.date).sort()[Math.floor(all.length / 2)]!;

      const since = await repository.search(1, { embedding, from: middle }, TOP_K);
      const until = await repository.search(1, { embedding, to: middle }, TOP_K);
      const { category, status } = all[0]!.document;
      const filtered = await repository.search(1, { embedding, category, status }, TOP_K);

      expect(range.from <= middle && middle <= range.to).toBe(true);
      expect(since.every((f) => f.document.date >= middle)).toBe(true);
      expect(until.every((f) => f.document.date <= middle)).toBe(true);
      expect(since.length + until.length).toBeGreaterThanOrEqual(all.length);
      expect(filtered.length).toBeGreaterThan(0);
      expect(
        filtered.every((f) => f.document.category === category && f.document.status === status),
      ).toBe(true);
    });

    it('knows the dates of the documents of a firm, and that a firm may have none', async () => {
      const range = await repository.dateRange(1);

      expect(range?.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range!.from <= range!.to).toBe(true);
      expect(await repository.dateRange(999_999)).toBeNull();
    });
  });

  describe('conversation log', () => {
    it('records a question with its embedding, its steps and its answer', async () => {
      const conversation = await log.start(1, userId);
      const embedding = await embeddingOf('SUP-0001');
      const source = await firstDocumentOf(1);

      const saved = await log.record({
        conversationId: conversation.id,
        question: '¿Qué incidencias recurrentes tiene?',
        questionEmbedding: embedding,
        answer: `Cobros [${source}].`,
        outcome: 'answered',
        sources: [source, 'SUP-9999'],
        model: 'some/model',
        usage: { inputTokens: 10, outputTokens: 2 },
        steps: [
          {
            kind: 'search',
            request: { query: 'cobros' },
            found: [{ id: source, similarity: 0.9 }],
          },
          { kind: 'reasoning', text: 'Busco cobros.' },
        ],
      });

      const [message] = await database.db.select().from(messages).where(eq(messages.id, saved.id));
      const recordedSteps = await database.db
        .select()
        .from(steps)
        .where(eq(steps.messageId, saved.id))
        .orderBy(steps.position);
      expect(message).toMatchObject({ enoughInformation: true, inputTokens: 10, outputTokens: 2 });
      expect(message!.questionEmbedding).toHaveLength(384);
      expect(recordedSteps.map((s) => [s.kind, s.detail])).toEqual([
        ['search', { request: { query: 'cobros' }, found: [{ id: source, similarity: 0.9 }] }],
        ['reasoning', { text: 'Busco cobros.' }],
      ]);

      const [read] = await log.messages(conversation.id);
      expect(read!.sources).toEqual([
        expect.objectContaining({ id: source, firmId: 1 }),
        { id: 'SUP-9999', deleted: true },
      ]);
      expect(await log.find(conversation.id)).toMatchObject({ firmId: 1, userId });
    });

    it('gives the last answered turns as history, oldest first', async () => {
      const conversation = await log.start(1, userId);
      const embedding = await embeddingOf('SUP-0001');
      const record = (question: string, outcome: 'answered' | 'not-enough-information') =>
        log.record({
          conversationId: conversation.id,
          question,
          questionEmbedding: embedding,
          answer: outcome === 'answered' ? `R ${question}` : null,
          outcome,
          sources: [],
          model: null,
          usage: null,
          steps: [],
        });
      await record('P1', 'answered');
      await record('P2', 'not-enough-information');
      await record('P3', 'answered');
      await record('P4', 'answered');

      expect(await log.history(conversation.id, 4)).toEqual([
        { role: 'user', text: 'P3' },
        { role: 'assistant', text: 'R P3' },
        { role: 'user', text: 'P4' },
        { role: 'assistant', text: 'R P4' },
      ]);
      expect(await log.find('00000000-0000-0000-0000-000000000000')).toBeNull();
    });
  });
});

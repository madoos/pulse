import type { Turn } from '@support-assistant/domain/Agent';
import type { ConversationLog, Message, Outcome } from '@support-assistant/domain/ConversationLog';
import type { SupportDocument } from '@support-assistant/domain/SupportDocument';
import type { SupportDocumentRepository } from '@support-assistant/domain/SupportDocumentRepository';
import type { Database } from '@shared/infrastructure/database';
import { and, asc, cosineDistance, desc, eq, gte, inArray, lte, max, min, sql } from 'drizzle-orm';
import { conversations, messages, steps, supportDocuments as d } from './schema';

const documentColumns = {
  id: d.id,
  firmId: d.firmId,
  date: d.date,
  type: d.type,
  category: d.category,
  priority: d.priority,
  status: d.status,
  title: d.title,
  text: d.text,
  tags: d.tags,
};

export const createPostgresSupportDocumentRepository = (
  db: Database,
): SupportDocumentRepository => ({
  search: async (firmId, { embedding, from, to, category, status }, limit) => {
    // Cosine similarity of normalized embeddings, from 0 to 1 for this model.
    const similarity = sql<number>`1 - (${cosineDistance(d.embedding, embedding)})`;
    const rows = await db
      .select({ ...documentColumns, similarity })
      .from(d)
      .where(
        and(
          // The firm goes first and is never optional: a search cannot see another firm.
          eq(d.firmId, firmId),
          from ? gte(d.date, from) : undefined,
          to ? lte(d.date, to) : undefined,
          category ? eq(d.category, category) : undefined,
          status ? eq(d.status, status) : undefined,
        ),
      )
      .orderBy(cosineDistance(d.embedding, embedding))
      .limit(limit);
    return rows.map(({ similarity, ...document }) => ({ document, similarity }));
  },

  dateRange: async (firmId) => {
    const [range] = await db
      .select({ from: min(d.date), to: max(d.date) })
      .from(d)
      .where(eq(d.firmId, firmId));
    return range?.from && range.to ? { from: range.from, to: range.to } : null;
  },
});

const iso = (date: Date) => date.toISOString();

export const createPostgresConversationLog = (db: Database): ConversationLog => ({
  start: async (firmId, userId) => {
    const [row] = await db.insert(conversations).values({ firmId, userId }).returning();
    return { ...row!, createdAt: iso(row!.createdAt) };
  },

  find: async (conversationId) => {
    const [row] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
    return row ? { ...row, createdAt: iso(row.createdAt) } : null;
  },

  history: async (conversationId, turns) => {
    const rows = await db
      .select({ question: messages.question, answer: messages.answer })
      .from(messages)
      .where(and(eq(messages.conversationId, conversationId), eq(messages.outcome, 'answered')))
      .orderBy(desc(messages.createdAt))
      .limit(Math.ceil(turns / 2));
    return rows.reverse().flatMap(({ question, answer }): Turn[] => [
      { role: 'user', text: question },
      { role: 'assistant', text: answer ?? '' },
    ]);
  },

  messages: async (conversationId) => {
    const rows = await db
      .select({
        id: messages.id,
        question: messages.question,
        answer: messages.answer,
        outcome: messages.outcome,
        sources: messages.sources,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
    const ids = [...new Set(rows.flatMap((row) => row.sources))];
    const documents = ids.length
      ? await db.select(documentColumns).from(d).where(inArray(d.id, ids))
      : [];
    const byId = new Map<string, SupportDocument>(documents.map((doc) => [doc.id, doc]));
    return rows.map((row): Message => ({
      ...row,
      outcome: row.outcome as Outcome,
      sources: row.sources.map((id) => byId.get(id) ?? { id, deleted: true }),
      createdAt: iso(row.createdAt),
    }));
  },

  record: (message) =>
    db.transaction(async (tx) => {
      const [saved] = await tx
        .insert(messages)
        .values({
          conversationId: message.conversationId,
          question: message.question,
          questionEmbedding: message.questionEmbedding,
          answer: message.answer,
          outcome: message.outcome,
          enoughInformation: message.outcome !== 'not-enough-information',
          sources: message.sources,
          model: message.model,
          inputTokens: message.usage?.inputTokens ?? null,
          outputTokens: message.usage?.outputTokens ?? null,
        })
        .returning({ id: messages.id, createdAt: messages.createdAt });
      if (message.steps.length) {
        await tx.insert(steps).values(
          message.steps.map(({ kind, ...detail }, position) => ({
            messageId: saved!.id,
            position,
            kind,
            detail,
          })),
        );
      }
      return { id: saved!.id, createdAt: iso(saved!.createdAt) };
    }),
});

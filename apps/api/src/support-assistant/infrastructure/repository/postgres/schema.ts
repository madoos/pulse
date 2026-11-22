import { advisoryFirms } from '@advisory-firms/infrastructure/repository/postgres/schema';
import { users } from '@auth/infrastructure/repository/postgres/schema';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

/** The dimensions of `multilingual-e5-small`, the model of the ingestion and of the questions. */
export const EMBEDDING_DIMENSIONS = 384;

/** The support documents of each firm, with the embedding the ingestion computed. */
export const supportDocuments = pgTable(
  'support_documents',
  {
    id: text('id').primaryKey(),
    firmId: integer('firm_id')
      .notNull()
      .references(() => advisoryFirms.id),
    date: date('date').notNull(),
    type: text('type').notNull(),
    category: text('category').notNull(),
    priority: text('priority').notNull(),
    status: text('status').notNull(),
    title: text('title').notNull(),
    text: text('text').notNull(),
    tags: text('tags').array().notNull(),
    // Tells the ingestion whether the document changed and its embedding must be recomputed.
    contentHash: text('content_hash').notNull(),
    embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
  },
  // Every search filters by firm first, and often by dates.
  (table) => [index('support_documents_firm_id_date_idx').on(table.firmId, table.date)],
);

/** The record of the assistant, apart from the business data. */
export const assistant = pgSchema('assistant');

export const conversations = assistant.table('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: integer('firm_id')
    .notNull()
    .references(() => advisoryFirms.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = assistant.table(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    questionEmbedding: vector('question_embedding', {
      dimensions: EMBEDDING_DIMENSIONS,
    }).notNull(),
    answer: text('answer'),
    outcome: text('outcome').notNull(),
    enoughInformation: boolean('enough_information').notNull(),
    // Ids, not foreign keys: a source deleted later must not delete the record of the answer.
    sources: text('sources').array().notNull(),
    model: text('model'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('messages_conversation_id_idx').on(table.conversationId, table.createdAt)],
);

export const steps = assistant.table(
  'steps',
  {
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    position: smallint('position').notNull(),
    kind: text('kind').notNull(),
    detail: jsonb('detail').notNull(),
  },
  (table) => [primaryKey({ columns: [table.messageId, table.position] })],
);

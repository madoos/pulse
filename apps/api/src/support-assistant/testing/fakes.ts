import type { Agent, AgentContext } from '@support-assistant/domain/Agent';
import type { ConversationLog, NewMessage } from '@support-assistant/domain/ConversationLog';
import type { Embedder } from '@support-assistant/domain/Embedder';
import type { FoundDocument, SupportDocument } from '@support-assistant/domain/SupportDocument';
import type { SupportDocumentRepository } from '@support-assistant/domain/SupportDocumentRepository';
import { vi } from 'vitest';

export const documentOf = (id: string, firmId = 1, date = '2025-11-03'): SupportDocument => ({
  id,
  firmId,
  date,
  type: 'ticket',
  category: 'Cobros',
  priority: 'media',
  status: 'resuelto',
  title: `Título de ${id}`,
  text: `Texto de ${id}`,
  tags: ['cobros'],
});

/** Documents of several firms, each with the similarity any search gives it. */
export const fakeDocuments = (documents: FoundDocument[]) => {
  const repository = {
    search: vi.fn<SupportDocumentRepository['search']>(async (firmId, query, limit) =>
      documents
        .filter(({ document }) => document.firmId === firmId)
        .filter(({ document }) => !query.from || document.date >= query.from)
        .filter(({ document }) => !query.to || document.date <= query.to)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit),
    ),
    dateRange: vi.fn<SupportDocumentRepository['dateRange']>(async (firmId) => {
      const dates = documents
        .filter(({ document }) => document.firmId === firmId)
        .map(({ document }) => document.date)
        .sort((a, b) => a.localeCompare(b));
      return dates.length ? { from: dates[0]!, to: dates.at(-1)! } : null;
    }),
  };
  return repository satisfies SupportDocumentRepository;
};

export const fakeEmbedder = () =>
  ({ embedQuery: vi.fn(async (text: string) => [text.length, 1, 0]) }) satisfies Embedder;

/** An agent that runs a script: the searches it asks for, then the text it answers. */
export const fakeAgent = (
  script: (context: AgentContext) => Promise<string> = async () => 'Respuesta.',
) => {
  const agent = {
    answer: vi.fn(async (context: AgentContext) => ({
      text: await script(context),
      model: 'fake/model',
      usage: { inputTokens: 100, outputTokens: 20 },
      reasoning: [],
    })),
  };
  return agent satisfies Agent;
};

/** The conversation every fake log knows, unless a test gives another one. */
export const CONVERSATION = { id: 'c-1', firmId: 1, userId: 'u-1' };

export const fakeLog = (conversation: typeof CONVERSATION = CONVERSATION) => {
  const recorded: NewMessage[] = [];
  const log = {
    recorded,
    start: vi.fn(async (firmId: number, userId: string) => ({
      id: 'c-new',
      firmId,
      userId,
      createdAt: '2026-11-22T10:00:00.000Z',
    })),
    find: vi.fn(async (id: string) =>
      id === conversation.id ? { ...conversation, createdAt: '2026-11-22T10:00:00.000Z' } : null,
    ),
    history: vi.fn(async () => []),
    messages: vi.fn(async () => []),
    record: vi.fn(async (message: NewMessage) => {
      recorded.push(message);
      return { id: `m-${recorded.length}`, createdAt: '2026-11-22T10:00:00.000Z' };
    }),
  };
  return log satisfies ConversationLog;
};

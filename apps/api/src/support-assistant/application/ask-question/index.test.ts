import { AgentFailedError, AgentQuotaExceededError } from '@support-assistant/domain/Agent';
import { ConversationNotFoundError } from '@support-assistant/domain/ConversationLog';
import { MAX_SEARCHES, TOP_K } from '@support-assistant/domain/Retrieval';
import {
  CONVERSATION,
  documentOf,
  fakeAgent,
  fakeDocuments,
  fakeEmbedder,
  fakeLog,
} from '@support-assistant/testing/fakes';
import { describe, expect, it, vi } from 'vitest';
import { makeAskQuestion } from '.';

const cite = (id: string) => `[${id}]`;

const ask = { firmId: 1, userId: 'u-1', conversationId: 'c-1', question: '¿Qué incidencias?' };

const setUp = (agent = fakeAgent(), conversation = CONVERSATION) => {
  const documents = fakeDocuments([
    { document: documentOf('SUP-0001', 1, '2025-06-10'), similarity: 0.85 },
    { document: documentOf('SUP-0002', 1, '2026-01-20'), similarity: 0.83 },
    { document: documentOf('SUP-0003', 1, '2026-02-01'), similarity: 0.7 },
    { document: documentOf('SUP-0100', 2, '2026-01-05'), similarity: 0.95 },
  ]);
  const embedder = fakeEmbedder();
  const log = fakeLog(conversation);
  const report = vi.fn();
  const askQuestion = makeAskQuestion({ documents, embedder, agent, log, report });
  return { askQuestion, documents, embedder, agent, log, report };
};

describe('askQuestion', () => {
  it('answers with the documents of the firm it cites as sources', async () => {
    const { askQuestion, agent } = setUp(fakeAgent(async () => 'Cobros tardíos [SUP-0001].'));

    const result = await askQuestion(ask);

    expect(result).toMatchObject({
      outcome: 'answered',
      answer: 'Cobros tardíos [SUP-0001].',
      sources: [documentOf('SUP-0001', 1, '2025-06-10')],
    });
    expect(agent.answer).toHaveBeenCalledOnce();
  });

  it('gives the agent what a first search found, above the threshold, and the dates', async () => {
    const { askQuestion, agent, documents } = setUp();

    await askQuestion(ask);

    expect(documents.search).toHaveBeenCalledWith(1, { embedding: [17, 1, 0] }, TOP_K);
    const context = agent.answer.mock.calls[0]![0];
    expect(context.found.map((f) => f.document.id)).toEqual(['SUP-0001', 'SUP-0002']);
    expect(context.documentDates).toEqual({ from: '2025-06-10', to: '2026-02-01' });
  });

  it('says there is not enough information without calling the model', async () => {
    const { askQuestion, agent, documents, log } = setUp();
    documents.search.mockResolvedValueOnce([{ document: documentOf('SUP-0003'), similarity: 0.6 }]);

    const result = await askQuestion(ask);

    expect(result).toMatchObject({ outcome: 'not-enough-information', answer: null, sources: [] });
    expect(agent.answer).not.toHaveBeenCalled();
    expect(log.recorded[0]).toMatchObject({ outcome: 'not-enough-information', model: null });
  });

  it('says there is not enough information for a firm without documents', async () => {
    const { askQuestion, agent } = setUp(fakeAgent(), { ...CONVERSATION, firmId: 3 });

    const result = await askQuestion({ ...ask, firmId: 3 });

    expect(result.outcome).toBe('not-enough-information');
    expect(agent.answer).not.toHaveBeenCalled();
  });

  it('only searches the firm of the question, whatever the agent asks for', async () => {
    const agent = fakeAgent(async ({ search }) => {
      const found = await search({ query: 'cobros', from: '2026-01-01' });
      return `Encontrado: ${found.map((f) => cite(f.document.id)).join(' ')} y [SUP-0100].`;
    });
    const { askQuestion, documents } = setUp(agent);

    const result = await askQuestion(ask);

    expect(documents.search).toHaveBeenLastCalledWith(
      1,
      { from: '2026-01-01', embedding: [6, 1, 0] },
      TOP_K,
    );
    expect(result.answer).toBe('Encontrado: [SUP-0002] y.');
    expect(result.sources.map((s) => s.id)).toEqual(['SUP-0002']);
  });

  it('stops searching after the maximum number of searches', async () => {
    const agent = fakeAgent(async ({ search }) => {
      const results = [];
      for (let i = 0; i < MAX_SEARCHES + 2; i += 1) results.push(await search({ query: `q${i}` }));
      return `${results.filter((r) => r.length > 0).length} búsquedas con resultados`;
    });
    const { askQuestion, documents } = setUp(agent);

    const result = await askQuestion(ask);

    expect(result.answer).toBe(`${MAX_SEARCHES} búsquedas con resultados`);
    // The first search with the question, and the ones allowed to the agent.
    expect(documents.search).toHaveBeenCalledTimes(1 + MAX_SEARCHES);
  });

  it('records the question, its embedding, every search and the answer', async () => {
    const agent = fakeAgent(async ({ search }) => {
      await search({ query: 'cobros', category: 'Cobros' });
      return 'Cobros [SUP-0002].';
    });
    const { askQuestion, log, report } = setUp(agent);

    await askQuestion(ask);

    expect(log.recorded).toEqual([
      {
        conversationId: 'c-1',
        question: ask.question,
        questionEmbedding: [17, 1, 0],
        answer: 'Cobros [SUP-0002].',
        outcome: 'answered',
        sources: ['SUP-0002'],
        model: 'fake/model',
        usage: { inputTokens: 100, outputTokens: 20 },
        steps: [
          {
            kind: 'search',
            request: { query: ask.question },
            found: [
              { id: 'SUP-0001', similarity: 0.85 },
              { id: 'SUP-0002', similarity: 0.83 },
            ],
          },
          {
            kind: 'search',
            request: { query: 'cobros', category: 'Cobros' },
            found: [
              { id: 'SUP-0001', similarity: 0.85 },
              { id: 'SUP-0002', similarity: 0.83 },
            ],
          },
        ],
      },
    ]);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ firmId: 1, outcome: 'answered', searches: 2, sources: 1 }),
    );
    expect(JSON.stringify(report.mock.calls)).not.toContain(ask.question);
  });

  it('records and reports that the quota of the model ran out', async () => {
    const { askQuestion, log } = setUp(
      fakeAgent(async () => {
        throw new AgentQuotaExceededError();
      }),
    );

    await expect(askQuestion(ask)).rejects.toBeInstanceOf(AgentQuotaExceededError);
    expect(log.recorded[0]).toMatchObject({ outcome: 'quota-exceeded', answer: null });
  });

  it('records and reports any other failure of the model', async () => {
    const { askQuestion, log } = setUp(
      fakeAgent(async () => {
        throw new Error('timeout');
      }),
    );

    await expect(askQuestion(ask)).rejects.toBeInstanceOf(AgentFailedError);
    expect(log.recorded[0]).toMatchObject({ outcome: 'failed' });
  });

  it('refuses a conversation of another firm or another user', async () => {
    const { askQuestion, embedder } = setUp();

    await expect(askQuestion({ ...ask, firmId: 2 })).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(askQuestion({ ...ask, userId: 'u-2' })).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(askQuestion({ ...ask, conversationId: 'c-9' })).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    expect(embedder.embedQuery).not.toHaveBeenCalled();
  });
});

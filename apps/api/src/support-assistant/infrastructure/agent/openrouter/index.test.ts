import { AgentFailedError, AgentQuotaExceededError } from '@support-assistant/domain/Agent';
import { MAX_SEARCHES } from '@support-assistant/domain/Retrieval';
import { documentOf } from '@support-assistant/testing/fakes';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOpenRouterAgent } from '.';

const callModel = vi.fn();

vi.mock('@openrouter/agent', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@openrouter/agent')>()),
  OpenRouter: class {
    callModel = callModel;
  },
}));

const context = {
  question: '¿Qué incidencias recurrentes tiene?',
  history: [
    { role: 'user' as const, text: '¿Y el IVA?' },
    { role: 'assistant' as const, text: 'Sin incidencias [SUP-0002].' },
  ],
  documentDates: { from: '2025-03-02', to: '2026-02-28' },
  found: [{ document: documentOf('SUP-0001'), similarity: 0.85 }],
  search: vi.fn(async () => [{ document: documentOf('SUP-0004'), similarity: 0.82 }]),
};

const succeed = () =>
  callModel.mockReturnValue({
    getText: async () => 'Cobros [SUP-0001].',
    getResponse: async () => ({
      model: 'some/free-model',
      output: [{ type: 'reasoning', summary: [{ type: 'summary_text', text: 'Busco cobros.' }] }],
    }),
    getUsage: async () => ({ inputTokens: 500, outputTokens: 40 }),
  });

const failWith = (statusCode: number) =>
  callModel.mockReturnValue({
    getText: async () => {
      throw Object.assign(new Error('provider error'), { statusCode });
    },
    getResponse: () => new Promise(() => {}),
    getUsage: () => new Promise(() => {}),
  });

describe('OpenRouter agent', () => {
  const agent = createOpenRouterAgent({ apiKey: 'key', model: 'openrouter/free' });

  beforeEach(() => callModel.mockReset());

  it('answers with the text, the model, the tokens and the reasoning', async () => {
    succeed();

    expect(await agent.answer(context)).toEqual({
      text: 'Cobros [SUP-0001].',
      model: 'some/free-model',
      usage: { inputTokens: 500, outputTokens: 40 },
      reasoning: ['Busco cobros.'],
    });
  });

  it('gives the model the history, the documents found, the dates and a bounded loop', async () => {
    succeed();

    await agent.answer(context);

    const request = callModel.mock.calls[0]![0];
    expect(request.model).toBe('openrouter/free');
    expect(request.instructions).toContain('2026-02-28');
    expect(request.input).toEqual([
      { role: 'user', content: '¿Y el IVA?' },
      { role: 'assistant', content: 'Sin incidencias [SUP-0002].' },
      { role: 'user', content: expect.stringContaining('[SUP-0001] 2025-11-03') },
    ]);
    expect(request.input[2].content).toContain(context.question);
    expect(request.stopWhen).toBeTypeOf('function');
    expect(request.stopWhen({ steps: Array(MAX_SEARCHES + 1) })).toBe(true);
  });

  it('gives the model a search tool without the firm, which runs the bound search', async () => {
    succeed();

    await agent.answer(context);

    const [searchTool] = callModel.mock.calls[0]![0].tools;
    expect(searchTool.function.name).toBe('search_support_documents');
    expect(Object.keys(searchTool.function.inputSchema.shape)).toEqual([
      'query',
      'from',
      'to',
      'category',
      'status',
    ]);
    const output = await searchTool.function.execute({ query: 'cobros', from: '2026-01-01' });
    expect(context.search).toHaveBeenCalledWith({ query: 'cobros', from: '2026-01-01' });
    expect(output).toContain('[SUP-0004]');
  });

  it.each([429, 402])('reports a %i as the quota running out', async (status) => {
    failWith(status);

    await expect(agent.answer(context)).rejects.toBeInstanceOf(AgentQuotaExceededError);
  });

  it('reports any other error as a failure of the model', async () => {
    failWith(500);

    await expect(agent.answer(context)).rejects.toBeInstanceOf(AgentFailedError);
  });
});

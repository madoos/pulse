import { createApp } from '@shared/infrastructure/http';
import { FirmNotFoundError } from '@support-assistant/application/start-conversation';
import { AgentFailedError, AgentQuotaExceededError } from '@support-assistant/domain/Agent';
import { ConversationNotFoundError } from '@support-assistant/domain/ConversationLog';
import { documentOf } from '@support-assistant/testing/fakes';
import type { MiddlewareHandler } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createSupportAssistantRoutes } from '.';

const CONVERSATION = '6b1f5a3e-2c4d-4e8f-9a0b-1c2d3e4f5a6b';
const BASE = `/api/v1/advisory-firms/1/assistant/conversations`;
const answer = {
  id: '7c2a6b4f-3d5e-4f9a-8b1c-2d3e4f5a6b7c',
  question: '¿Qué incidencias?',
  answer: 'Cobros [SUP-0001].',
  outcome: 'answered' as const,
  sources: [documentOf('SUP-0001')],
  createdAt: '2026-11-22T10:00:00.000Z',
};
const source = {
  id: 'SUP-0001',
  date: '2025-11-03',
  type: 'ticket',
  category: 'Cobros',
  status: 'resuelto',
  title: 'Título de SUP-0001',
};

const setUp = (configured = true) => {
  const assistant = {
    startConversation: vi.fn(async ({ firmId, userId }: { firmId: number; userId: string }) => ({
      id: CONVERSATION,
      firmId,
      userId,
      createdAt: answer.createdAt,
    })),
    getConversation: vi.fn(async () => ({
      id: CONVERSATION,
      firmId: 1,
      messages: [
        {
          ...answer,
          sources: [documentOf('SUP-0001'), { id: 'SUP-0009', deleted: true as const }],
        },
      ],
    })),
    askQuestion: vi.fn(async () => answer),
  };
  const requireSession: MiddlewareHandler = async (c, next) => {
    c.set('session', { sessionId: 's-1', user: { id: 'u-1', email: 'a@b.c' } });
    await next();
  };
  const app = createApp([
    createSupportAssistantRoutes({ assistant: configured ? assistant : null, requireSession }),
  ]);
  return { app, ...assistant };
};

const post = (body: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('support assistant routes', () => {
  it('starts a conversation of the user of the session', async () => {
    const { app, startConversation } = setUp();

    const res = await app.request(BASE, { method: 'POST' });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: CONVERSATION, firmId: 1, messages: [] });
    expect(startConversation).toHaveBeenCalledWith({ firmId: 1, userId: 'u-1' });
  });

  it('answers 404 for a firm that does not exist', async () => {
    const { app, startConversation } = setUp();
    startConversation.mockRejectedValueOnce(new FirmNotFoundError(1));

    expect((await app.request(BASE, { method: 'POST' })).status).toBe(404);
  });

  it('answers a question with its sources as the contract describes them', async () => {
    const { app, askQuestion } = setUp();

    const res = await app.request(
      `${BASE}/${CONVERSATION}/messages`,
      post({ question: ' ¿Qué incidencias? ' }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...answer, sources: [source] });
    expect(askQuestion).toHaveBeenCalledWith({
      firmId: 1,
      userId: 'u-1',
      conversationId: CONVERSATION,
      question: '¿Qué incidencias?',
    });
  });

  it('rejects an empty question', async () => {
    const { app, askQuestion } = setUp();

    const res = await app.request(`${BASE}/${CONVERSATION}/messages`, post({ question: ' ' }));

    expect(res.status).toBe(400);
    expect(askQuestion).not.toHaveBeenCalled();
  });

  it.each([
    [new AgentQuotaExceededError(), 429],
    [new AgentFailedError(new Error('down')), 502],
    [new ConversationNotFoundError(CONVERSATION), 404],
  ])('answers %s with %i', async (error, status) => {
    const { app, askQuestion } = setUp();
    askQuestion.mockRejectedValueOnce(error);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await app.request(`${BASE}/${CONVERSATION}/messages`, post({ question: '¿IVA?' }));

    expect(res.status).toBe(status);
    expect(res.headers.get('Content-Type')).toContain('application/problem+json');
  });

  it('returns a conversation without the sources deleted since', async () => {
    const { app } = setUp();

    const res = await app.request(`${BASE}/${CONVERSATION}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: CONVERSATION,
      firmId: 1,
      messages: [{ ...answer, sources: [source] }],
    });
  });

  it('reports itself as unavailable without configuration', async () => {
    const { app } = setUp(false);

    expect((await app.request(BASE, { method: 'POST' })).status).toBe(503);
    expect((await app.request(`${BASE}/${CONVERSATION}`)).status).toBe(503);
  });
});

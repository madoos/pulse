import { ApiError } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { expectEpic } from '@shared/testing/epic';
import { throwError } from 'rxjs';
import { describe, it } from 'vitest';
import { askQuestionEpic, startConversationEpic } from './supportAssistant.epics';
import {
  assistantClosed,
  conversationFailed,
  conversationRequested,
  conversationStarted,
  conversationUnavailable,
  questionAnswered,
  questionAsked,
  questionFailed,
} from './supportAssistant.slice';

const CONVERSATION = '6b1f5a3e-2c4d-4e8f-9a0b-1c2d3e4f5a6b';
const asked = (question: string) => questionAsked({ firmId: 7, conversationId: 'c-1', question });
const answer = (question: string) => ({
  id: '7c2a6b4f-3d5e-4f9a-8b1c-2d3e4f5a6b7c',
  question,
  answer: `Respuesta a ${question}`,
  outcome: 'answered' as const,
  sources: [],
  createdAt: '2026-11-22T10:00:00.000Z',
});

describe('startConversationEpic', () => {
  it('starts a conversation about the firm', () => {
    expectEpic(startConversationEpic, {
      api: (cold) =>
        createFakeApi({
          supportAssistant: {
            start: (firmId) => cold('--r', { r: { id: CONVERSATION, firmId, messages: [] } }),
          },
        }),
      actions: { marbles: '-a', values: { a: conversationRequested(7) } },
      expected: { marbles: '---s', values: { s: conversationStarted(CONVERSATION) } },
    });
  });

  it('tells an assistant that is not configured from one that failed', () => {
    expectEpic(startConversationEpic, {
      api: () =>
        createFakeApi({
          supportAssistant: {
            start: (firmId) =>
              throwError(() => (firmId === 1 ? new ApiError(503) : new Error('down'))),
          },
        }),
      actions: {
        marbles: '-a-b',
        values: { a: conversationRequested(1), b: conversationRequested(2) },
      },
      expected: {
        marbles: '-u-f',
        values: { u: conversationUnavailable(), f: conversationFailed() },
      },
    });
  });

  it('stops starting it when the window closes', () => {
    expectEpic(startConversationEpic, {
      api: (cold) =>
        createFakeApi({
          supportAssistant: {
            start: (firmId) => cold('----r', { r: { id: CONVERSATION, firmId, messages: [] } }),
          },
        }),
      actions: {
        marbles: '-ac',
        values: { a: conversationRequested(7), c: assistantClosed() },
        hot: true,
      },
      expected: { marbles: '', values: {} },
    });
  });
});

describe('askQuestionEpic', () => {
  it('answers a question, and ignores another one while the answer is on its way', () => {
    expectEpic(askQuestionEpic, {
      api: (cold) =>
        createFakeApi({
          supportAssistant: { ask: (_f, _c, question) => cold('---(r|)', { r: answer(question) }) },
        }),
      actions: {
        marbles: '-ab----c',
        values: { a: asked('P1'), b: asked('P2'), c: asked('P3') },
        hot: true,
      },
      expected: {
        marbles: '----x-----y',
        values: { x: questionAnswered(answer('P1')), y: questionAnswered(answer('P3')) },
      },
    });
  });

  it('tells the quota of the model running out from other failures', () => {
    const errors: Record<string, unknown> = {
      P1: new ApiError(429),
      P2: new ApiError(503),
      P3: new ApiError(502),
    };
    expectEpic(askQuestionEpic, {
      api: () =>
        createFakeApi({
          supportAssistant: { ask: (_f, _c, question) => throwError(() => errors[question]) },
        }),
      actions: { marbles: '-abc', values: { a: asked('P1'), b: asked('P2'), c: asked('P3') } },
      expected: {
        marbles: '-quf',
        values: {
          q: questionFailed('quota-exceeded'),
          u: questionFailed('unavailable'),
          f: questionFailed('failed'),
        },
      },
    });
  });

  it('cancels the question on its way when the window closes', () => {
    expectEpic(askQuestionEpic, {
      api: (cold) =>
        createFakeApi({
          supportAssistant: { ask: (_f, _c, question) => cold('---(r|)', { r: answer(question) }) },
        }),
      actions: { marbles: '-ac', values: { a: asked('P1'), c: assistantClosed() }, hot: true },
      expected: { marbles: '', values: {} },
    });
  });
});

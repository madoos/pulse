import { describe, expect, it } from 'vitest';
import {
  assistantClosed,
  assistantOpened,
  conversationRequested,
  conversationStarted,
  questionAnswered,
  questionAsked,
  questionFailed,
  supportAssistantSlice,
  type SupportAssistantState,
} from './supportAssistant.slice';

const reduce = (...actions: Parameters<typeof supportAssistantSlice.reducer>[1][]) =>
  actions.reduce<SupportAssistantState>(
    (state, action) => supportAssistantSlice.reducer(state, action),
    supportAssistantSlice.getInitialState(),
  );

const ask = (question: string) => questionAsked({ firmId: 7, conversationId: 'c-1', question });
const source = {
  id: 'SUP-0001',
  date: '2025-11-03',
  type: 'ticket',
  category: 'Cobros',
  status: 'resuelto',
  title: 'Retraso',
};

describe('supportAssistantSlice', () => {
  it('keeps the conversation of a firm when the window closes and opens again', () => {
    const state = reduce(
      assistantOpened(7),
      conversationRequested(7),
      conversationStarted('c-1'),
      ask('P1'),
      assistantClosed(),
      assistantOpened(7),
    );

    expect(state).toMatchObject({ isOpen: true, conversation: { status: 'ready', id: 'c-1' } });
  });

  it('starts over with another firm', () => {
    const state = reduce(
      assistantOpened(7),
      conversationStarted('c-1'),
      ask('P1'),
      assistantOpened(8),
    );

    expect(state).toMatchObject({ firmId: 8, conversation: { status: 'idle' }, exchanges: [] });
  });

  it('drops the question on its way when the window closes', () => {
    const state = reduce(
      assistantOpened(7),
      conversationStarted('c-1'),
      ask('P1'),
      assistantClosed(),
    );

    expect(state.exchanges).toEqual([]);
  });

  it('fills the question on its way with its answer and its sources', () => {
    const state = reduce(
      ask('P1'),
      questionAnswered({
        id: 'm-1',
        question: 'P1',
        answer: 'R1 [SUP-0001]',
        outcome: 'answered',
        sources: [source],
        createdAt: '2026-11-22T10:00:00.000Z',
      }),
      ask('P2'),
      questionAnswered({
        id: 'm-2',
        question: 'P2',
        answer: null,
        outcome: 'not-enough-information',
        sources: [],
        createdAt: '2026-11-22T10:00:00.000Z',
      }),
    );

    expect(state.exchanges).toEqual([
      { question: 'P1', status: 'answered', answer: 'R1 [SUP-0001]', sources: [source] },
      { question: 'P2', status: 'not-enough-information', answer: null, sources: [] },
    ]);
  });

  it('marks the question that failed, and an assistant that stopped being available', () => {
    const state = reduce(
      conversationStarted('c-1'),
      ask('P1'),
      questionFailed('quota-exceeded'),
      ask('P2'),
      questionFailed('unavailable'),
    );

    expect(state.exchanges.map((e) => e.status)).toEqual(['quota-exceeded', 'unavailable']);
    expect(state.conversation.status).toBe('unavailable');
  });
});

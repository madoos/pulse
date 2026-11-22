import { describe, expect, it } from 'vitest';
import {
  AssistantMessageSchema,
  ConversationParamsSchema,
  QuestionSchema,
} from './support-assistant';

const message = {
  id: '6b1f5a3e-2c4d-4e8f-9a0b-1c2d3e4f5a6b',
  question: '¿Qué incidencias recurrentes tiene?',
  answer: 'Retrasos en los cobros [SUP-0002].',
  outcome: 'answered',
  sources: [
    {
      id: 'SUP-0002',
      date: '2025-11-03',
      type: 'ticket',
      category: 'Cobros',
      status: 'resuelto',
      title: 'Retraso en el pago',
    },
  ],
  createdAt: '2026-11-22T10:00:00.000Z',
};

describe('QuestionSchema', () => {
  it('trims the question and rejects one too short or too long', () => {
    expect(QuestionSchema.parse({ question: '  ¿IVA?  ' })).toEqual({ question: '¿IVA?' });
    expect(QuestionSchema.safeParse({ question: ' a ' }).success).toBe(false);
    expect(QuestionSchema.safeParse({ question: 'a'.repeat(501) }).success).toBe(false);
  });
});

describe('ConversationParamsSchema', () => {
  it('reads the firm id as a number and requires a uuid', () => {
    expect(ConversationParamsSchema.parse({ id: '7', conversationId: message.id })).toEqual({
      id: 7,
      conversationId: message.id,
    });
    expect(ConversationParamsSchema.safeParse({ id: '7', conversationId: 'x' }).success).toBe(
      false,
    );
  });
});

describe('AssistantMessageSchema', () => {
  it('accepts an answer with its sources and a question without answer', () => {
    expect(AssistantMessageSchema.parse(message)).toEqual(message);
    expect(
      AssistantMessageSchema.parse({
        ...message,
        answer: null,
        outcome: 'not-enough-information',
        sources: [],
      }).answer,
    ).toBeNull();
  });

  it('rejects an unknown outcome', () => {
    expect(AssistantMessageSchema.safeParse({ ...message, outcome: 'maybe' }).success).toBe(false);
  });
});

import type { AgentUsage, SearchRequest, Turn } from './Agent';
import type { SupportDocument } from './SupportDocument';

export type Conversation = { id: string; firmId: number; userId: string; createdAt: string };

/** How a question ended. Only an answered question has an answer and sources. */
export type Outcome = 'answered' | 'not-enough-information' | 'quota-exceeded' | 'failed';

/** What the agent did to answer: each search with what it found, and its reasoning if exposed. */
export type Step =
  | { kind: 'search'; request: SearchRequest; found: { id: string; similarity: number }[] }
  | { kind: 'reasoning'; text: string };

export type NewMessage = {
  conversationId: string;
  question: string;
  /** Kept to evaluate the retrieval or reuse searches later, without embedding again. */
  questionEmbedding: number[];
  answer: string | null;
  outcome: Outcome;
  /** The ids of the documents the answer cites. */
  sources: string[];
  model: string | null;
  usage: AgentUsage | null;
  steps: Step[];
};

/** A message as it is read back: its sources as the database has them today. */
export type Message = {
  id: string;
  question: string;
  answer: string | null;
  outcome: Outcome;
  /** A source that was deleted after the answer is null. */
  sources: (SupportDocument | { id: string; deleted: true })[];
  createdAt: string;
};

/** The record of every conversation, question, answer and step of the agent. */
export type ConversationLog = {
  start: (firmId: number, userId: string) => Promise<Conversation>;
  find: (conversationId: string) => Promise<Conversation | null>;
  /** The last answered turns of a conversation, oldest first. */
  history: (conversationId: string, turns: number) => Promise<Turn[]>;
  messages: (conversationId: string) => Promise<Message[]>;
  record: (message: NewMessage) => Promise<{ id: string; createdAt: string }>;
};

/** No conversation with that id belongs to that firm and user. */
export class ConversationNotFoundError extends Error {
  constructor(id: string) {
    super(`There is no conversation ${id} for this advisory firm`);
  }
}

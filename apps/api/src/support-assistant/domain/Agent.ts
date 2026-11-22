import type { FoundDocument, SearchFilters } from './SupportDocument';

/** A search the agent asks for: what to look for, and optional filters. */
export type SearchRequest = SearchFilters & { query: string };

/** The search the agent can use, already bound to one firm. */
export type Search = (request: SearchRequest) => Promise<FoundDocument[]>;

export type Turn = { role: 'user' | 'assistant'; text: string };

export type AgentUsage = { inputTokens: number; outputTokens: number };

export type AgentAnswer = {
  text: string;
  /** The model that answered, as the provider reports it. */
  model: string;
  usage: AgentUsage | null;
  /** The reasoning of the model, when it exposes it. */
  reasoning: string[];
};

export type AgentContext = {
  question: string;
  /** The previous turns of the conversation, oldest first. */
  history: Turn[];
  /** The dates of the documents of the firm, so the agent can narrow by date. */
  documentDates: { from: string; to: string };
  /** What a first search with the question found, so the agent may not need to search. */
  found: FoundDocument[];
  search: Search;
};

/** Answers a question about one firm, searching its documents as many times as it needs. */
export type Agent = { answer: (context: AgentContext) => Promise<AgentAnswer> };

/** The free quota of the model ran out: the user has to wait or the model has to change. */
export class AgentQuotaExceededError extends Error {
  constructor() {
    super('The quota of the model is exhausted');
  }
}

/** The model could not answer, for any other reason. */
export class AgentFailedError extends Error {
  constructor(cause: unknown) {
    super('The model could not answer', { cause });
  }
}

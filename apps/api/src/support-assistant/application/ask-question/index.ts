import {
  AgentFailedError,
  AgentQuotaExceededError,
  type Agent,
  type AgentAnswer,
  type Search,
  type SearchRequest,
} from '@support-assistant/domain/Agent';
import {
  ConversationNotFoundError,
  type ConversationLog,
  type NewMessage,
  type Step,
} from '@support-assistant/domain/ConversationLog';
import type { Embedder } from '@support-assistant/domain/Embedder';
import {
  HISTORY_TURNS,
  MAX_SEARCHES,
  TOP_K,
  relevantOf,
  sourcesOf,
  withoutUnknownCitations,
} from '@support-assistant/domain/Retrieval';
import type { FoundDocument, SupportDocument } from '@support-assistant/domain/SupportDocument';
import type { SupportDocumentRepository } from '@support-assistant/domain/SupportDocumentRepository';

export type AskQuestionInput = {
  firmId: number;
  userId: string;
  conversationId: string;
  question: string;
};

export type AskQuestionResult = {
  id: string;
  question: string;
  answer: string | null;
  outcome: 'answered' | 'not-enough-information';
  sources: SupportDocument[];
  createdAt: string;
};

export type AskQuestion = (input: AskQuestionInput) => Promise<AskQuestionResult>;

/** A summary of each question, for the logs: never its text, which may hold client data. */
export type QuestionReport = {
  firmId: number;
  conversationId: string;
  outcome: NewMessage['outcome'];
  searches: number;
  sources: number;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  milliseconds: number;
};

type Dependencies = {
  documents: SupportDocumentRepository;
  embedder: Embedder;
  agent: Agent;
  log: ConversationLog;
  report?: (report: QuestionReport) => void;
  now?: () => number;
};

/**
 * Answers a question about one firm from its support documents.
 *
 * - The firm comes from the caller and is fixed in every search: the agent chooses what to
 *   search for, never in which firm.
 * - Without a document similar enough to the question, it says there is not enough
 *   information, without calling the model.
 * - The sources are the documents the answer cites that a search of this firm returned.
 * - Everything is recorded: the question and its embedding, each search and the answer.
 */
export const makeAskQuestion =
  ({
    documents,
    embedder,
    agent,
    log,
    report = () => {},
    now = Date.now,
  }: Dependencies): AskQuestion =>
  async ({ firmId, userId, conversationId, question }) => {
    const startedAt = now();
    const conversation = await log.find(conversationId);
    if (!conversation || conversation.firmId !== firmId || conversation.userId !== userId) {
      throw new ConversationNotFoundError(conversationId);
    }

    const steps: Step[] = [];
    const retrieved = new Map<string, FoundDocument>();
    const searchWith = async (request: SearchRequest, embedding: number[]) => {
      const { from, to, category, status } = request;
      const query = { from, to, category, status, embedding };
      const found = relevantOf(await documents.search(firmId, query, TOP_K));
      steps.push({
        kind: 'search',
        request,
        found: found.map((f) => ({ id: f.document.id, similarity: f.similarity })),
      });
      for (const f of found) retrieved.set(f.document.id, f);
      return found;
    };

    const questionEmbedding = await embedder.embedQuery(question);
    const record = (
      message: Omit<NewMessage, 'conversationId' | 'question' | 'questionEmbedding'>,
    ) => {
      report({
        firmId,
        conversationId,
        outcome: message.outcome,
        searches: steps.filter((step) => step.kind === 'search').length,
        sources: message.sources.length,
        model: message.model,
        inputTokens: message.usage?.inputTokens ?? null,
        outputTokens: message.usage?.outputTokens ?? null,
        milliseconds: now() - startedAt,
      });
      return log.record({ conversationId, question, questionEmbedding, ...message });
    };

    const [firstFound, documentDates] = await Promise.all([
      searchWith({ query: question }, questionEmbedding),
      documents.dateRange(firmId),
    ]);
    if (firstFound.length === 0 || !documentDates) {
      const saved = await record({
        answer: null,
        outcome: 'not-enough-information',
        sources: [],
        model: null,
        usage: null,
        steps,
      });
      return { ...saved, question, answer: null, outcome: 'not-enough-information', sources: [] };
    }

    let searches = 0;
    const search: Search = async (request) => {
      searches += 1;
      if (searches > MAX_SEARCHES) return [];
      return searchWith(request, await embedder.embedQuery(request.query));
    };

    let answer: AgentAnswer;
    try {
      answer = await agent.answer({
        question,
        history: await log.history(conversationId, HISTORY_TURNS),
        documentDates,
        search,
        found: firstFound,
      });
    } catch (error) {
      const quota = error instanceof AgentQuotaExceededError;
      await record({
        answer: null,
        outcome: quota ? 'quota-exceeded' : 'failed',
        sources: [],
        model: null,
        usage: null,
        steps,
      });
      if (quota) throw error;
      throw error instanceof AgentFailedError ? error : new AgentFailedError(error);
    }

    const text = withoutUnknownCitations(answer.text, retrieved);
    const sources = sourcesOf(text, retrieved);
    const saved = await record({
      answer: text,
      outcome: 'answered',
      sources: sources.map((s) => s.id),
      model: answer.model,
      usage: answer.usage,
      steps: [...steps, ...answer.reasoning.map((r) => ({ kind: 'reasoning' as const, text: r }))],
    });
    return { ...saved, question, answer: text, outcome: 'answered', sources };
  };

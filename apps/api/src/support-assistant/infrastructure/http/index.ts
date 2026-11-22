import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import {
  AdvisoryFirmIdSchema,
  AssistantMessageSchema,
  ConversationParamsSchema,
  ConversationSchema,
  ProblemSchema,
  QuestionSchema,
  type AssistantMessage,
  type SupportSource,
} from '@pulse/contracts';
import { problem } from '@shared/infrastructure/http';
import type { AskQuestion } from '@support-assistant/application/ask-question';
import type { GetConversation } from '@support-assistant/application/get-conversation';
import {
  FirmNotFoundError,
  type StartConversation,
} from '@support-assistant/application/start-conversation';
import { AgentFailedError, AgentQuotaExceededError } from '@support-assistant/domain/Agent';
import { ConversationNotFoundError, type Message } from '@support-assistant/domain/ConversationLog';
import type { SupportDocument } from '@support-assistant/domain/SupportDocument';
import type { Context, MiddlewareHandler } from 'hono';

const problemContent = { 'application/problem+json': { schema: ProblemSchema } };

const UNAVAILABLE = 'The support assistant is not configured';
const QUOTA_EXCEEDED = 'The quota of the model is exhausted; try again later';
const FAILED = 'The model could not answer; try again';

type Dependencies = {
  /** Null when the assistant is not configured: every route answers 503. */
  assistant: {
    startConversation: StartConversation;
    getConversation: GetConversation;
    askQuestion: AskQuestion;
  } | null;
  requireSession: MiddlewareHandler;
};

const sourceOf = (document: SupportDocument): SupportSource => ({
  id: document.id,
  date: document.date,
  type: document.type,
  category: document.category,
  status: document.status,
  title: document.title,
});

const messageOf = (message: Message): AssistantMessage => ({
  ...message,
  sources: message.sources.flatMap((source) => ('deleted' in source ? [] : [sourceOf(source)])),
});

const notFound = (c: Context, error: unknown) => {
  if (error instanceof FirmNotFoundError || error instanceof ConversationNotFoundError) {
    return problem(c, 404, error.message);
  }
  throw error;
};

const modelFailure = (c: Context, error: unknown) => {
  if (error instanceof AgentQuotaExceededError) return problem(c, 429, QUOTA_EXCEEDED);
  if (error instanceof AgentFailedError) {
    console.error(error.cause ?? error);
    return problem(c, 502, FAILED);
  }
  return notFound(c, error);
};

export const createSupportAssistantRoutes = ({ assistant, requireSession }: Dependencies) => {
  const middleware = [requireSession];
  const tags = ['Support assistant'];
  const common = {
    401: { description: 'There is no active session', content: problemContent },
    503: { description: 'The assistant is not configured', content: problemContent },
  };

  const startRoute = createRoute({
    method: 'post',
    path: '/advisory-firms/{id}/assistant/conversations',
    tags,
    summary: 'Start a conversation with the support assistant about an advisory firm',
    middleware,
    request: { params: AdvisoryFirmIdSchema },
    responses: {
      201: {
        description: 'The new conversation, without messages',
        content: { 'application/json': { schema: ConversationSchema } },
      },
      400: { description: 'The id is not valid', content: problemContent },
      404: { description: 'There is no advisory firm with that id', content: problemContent },
      ...common,
    },
  });

  const conversationRoute = createRoute({
    method: 'get',
    path: '/advisory-firms/{id}/assistant/conversations/{conversationId}',
    tags,
    summary: 'Get a conversation with its questions and answers',
    middleware,
    request: { params: ConversationParamsSchema },
    responses: {
      200: {
        description: 'The conversation, oldest message first',
        content: { 'application/json': { schema: ConversationSchema } },
      },
      400: { description: 'The ids are not valid', content: problemContent },
      404: {
        description: 'There is no such conversation for this firm and user',
        content: problemContent,
      },
      ...common,
    },
  });

  const askRoute = createRoute({
    method: 'post',
    path: '/advisory-firms/{id}/assistant/conversations/{conversationId}/messages',
    tags,
    summary: 'Ask a question about the advisory firm',
    description:
      'Answers from the support documents of the firm only, citing them. Without documents ' +
      'similar enough to the question, it says there is not enough information.',
    middleware,
    request: {
      params: ConversationParamsSchema,
      body: { content: { 'application/json': { schema: QuestionSchema } }, required: true },
    },
    responses: {
      201: {
        description: 'The answer and its sources',
        content: { 'application/json': { schema: AssistantMessageSchema } },
      },
      400: { description: 'The ids or the question are not valid', content: problemContent },
      404: {
        description: 'There is no such conversation for this firm and user',
        content: problemContent,
      },
      429: { description: 'The quota of the model is exhausted', content: problemContent },
      502: { description: 'The model could not answer', content: problemContent },
      ...common,
    },
  });

  return new OpenAPIHono()
    .openapi(startRoute, async (c) => {
      if (!assistant) return problem(c, 503, UNAVAILABLE);
      try {
        const conversation = await assistant.startConversation({
          firmId: c.req.valid('param').id,
          userId: c.get('session').user.id,
        });
        return c.json({ id: conversation.id, firmId: conversation.firmId, messages: [] }, 201);
      } catch (error) {
        return notFound(c, error);
      }
    })
    .openapi(conversationRoute, async (c) => {
      if (!assistant) return problem(c, 503, UNAVAILABLE);
      const { id, conversationId } = c.req.valid('param');
      try {
        const conversation = await assistant.getConversation({
          firmId: id,
          userId: c.get('session').user.id,
          conversationId,
        });
        return c.json({ ...conversation, messages: conversation.messages.map(messageOf) }, 200);
      } catch (error) {
        return notFound(c, error);
      }
    })
    .openapi(askRoute, async (c) => {
      if (!assistant) return problem(c, 503, UNAVAILABLE);
      const { id, conversationId } = c.req.valid('param');
      try {
        const answer = await assistant.askQuestion({
          firmId: id,
          userId: c.get('session').user.id,
          conversationId,
          question: c.req.valid('json').question,
        });
        return c.json({ ...answer, sources: answer.sources.map(sourceOf) }, 201);
      } catch (error) {
        return modelFailure(c, error);
      }
    });
};

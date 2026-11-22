import { OpenRouter, stepCountIs, tool, type Item } from '@openrouter/agent';
import {
  AgentFailedError,
  AgentQuotaExceededError,
  type Agent,
  type AgentContext,
} from '@support-assistant/domain/Agent';
import { MAX_SEARCHES } from '@support-assistant/domain/Retrieval';
import { z } from 'zod';
import { CATEGORIES, STATUSES, describeAll, instructionsFor } from './instructions';

const SearchInputSchema = z.object({
  query: z.string().min(1).describe('Qué buscar, en palabras: "retrasos en el pago de cuotas"'),
  from: z.iso.date().optional().describe('Solo documentos desde esta fecha (AAAA-MM-DD)'),
  to: z.iso.date().optional().describe('Solo documentos hasta esta fecha (AAAA-MM-DD)'),
  category: z.enum(CATEGORIES).optional().describe('Solo documentos de esta categoría'),
  status: z.enum(STATUSES).optional().describe('Solo documentos en este estado'),
});

/** The free quota ran out (429), or there are no credits left (402). */
const QUOTA_STATUSES = new Set([402, 429]);

const statusOf = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  if ('statusCode' in error && typeof error.statusCode === 'number') return error.statusCode;
  return 'cause' in error ? statusOf(error.cause) : undefined;
};

/**
 * The agent on OpenRouter: a model with one tool, the search of the documents of the firm.
 *
 * The tool takes what to search and optional filters, never the firm: the search it runs is
 * already bound to the firm of the question. The model can search again, up to a number of
 * steps; after that it must answer with what it has.
 */
export const createOpenRouterAgent = ({
  apiKey,
  model,
}: {
  apiKey: string;
  model: string;
}): Agent => {
  const openrouter = new OpenRouter({ apiKey });

  return {
    answer: async ({ question, history, documentDates, found, search }: AgentContext) => {
      const searchTool = tool({
        name: 'search_support_documents',
        description:
          'Busca en los documentos de soporte de esta asesoría los más parecidos a la consulta. ' +
          'Acepta filtros por fechas, categoría y estado.',
        inputSchema: SearchInputSchema,
        execute: async (input) => describeAll(await search(input)),
      });

      try {
        const result = openrouter.callModel({
          model,
          instructions: instructionsFor({ documentDates }),
          input: [
            ...history.map((turn): Item =>
              turn.role === 'user'
                ? { role: 'user', content: turn.text }
                : { role: 'assistant', content: turn.text },
            ),
            {
              role: 'user' as const,
              content: `Documentos encontrados para la pregunta:\n\n${describeAll(found)}\n\nPregunta: ${question}`,
            },
          ],
          tools: [searchTool] as const,
          // One step per search, and one more to answer.
          stopWhen: stepCountIs(MAX_SEARCHES + 1),
        });
        const [text, response, usage] = await Promise.all([
          result.getText(),
          result.getResponse(),
          result.getUsage(),
        ]);
        const reasoning = response.output.flatMap((item) =>
          item.type === 'reasoning'
            ? (item.summary ?? []).map((part) => part.text).filter(Boolean)
            : [],
        );
        return {
          text,
          model: response.model,
          usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
          reasoning,
        };
      } catch (error) {
        const status = statusOf(error);
        if (status !== undefined && QUOTA_STATUSES.has(status)) throw new AgentQuotaExceededError();
        throw new AgentFailedError(error);
      }
    },
  };
};

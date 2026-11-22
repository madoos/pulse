import { z } from 'zod';

export const ConversationParamsSchema = z.object({
  id: z.coerce.number().int().positive().meta({ description: 'Advisory firm id' }),
  conversationId: z.uuid().meta({ description: 'Conversation id' }),
});

export const SupportSourceSchema = z
  .object({
    id: z.string().meta({ description: 'As SUP-0001' }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.string().meta({ description: 'chat, nota_interna, ticket or email' }),
    category: z.string(),
    status: z.string(),
    title: z.string(),
  })
  .meta({ id: 'SupportSource', description: 'A support document an answer is based on' });

export type SupportSource = z.infer<typeof SupportSourceSchema>;

export const QuestionSchema = z
  .object({ question: z.string().trim().min(3).max(500) })
  .meta({ id: 'Question', description: 'A question about the advisory firm' });

export type Question = z.infer<typeof QuestionSchema>;

export const AssistantMessageSchema = z
  .object({
    id: z.uuid(),
    question: z.string(),
    answer: z.string().nullable().meta({ description: 'Null when there is no answer' }),
    outcome: z
      .enum(['answered', 'not-enough-information', 'quota-exceeded', 'failed'])
      .meta({ description: 'How the question ended' }),
    sources: z.array(SupportSourceSchema).meta({
      description: 'The documents the answer cites, as they are today; deleted ones are left out',
    }),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'AssistantMessage', description: 'A question and its answer' });

export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

export const ConversationSchema = z
  .object({
    id: z.uuid(),
    firmId: z.number().int(),
    messages: z.array(AssistantMessageSchema),
  })
  .meta({ id: 'Conversation', description: 'A conversation with the support assistant' });

export type Conversation = z.infer<typeof ConversationSchema>;

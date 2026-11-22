import {
  AssistantMessageSchema,
  ConversationSchema,
  type AssistantMessage,
  type Conversation,
} from '@pulse/contracts';
import type { Observable } from 'rxjs';
import type { Request } from './request';

export type SupportAssistantApi = {
  start: (firmId: number) => Observable<Conversation>;
  ask: (firmId: number, conversationId: string, question: string) => Observable<AssistantMessage>;
};

export const createSupportAssistantApi = (request: Request): SupportAssistantApi => ({
  start: (firmId) =>
    request('POST', `/advisory-firms/${firmId}/assistant/conversations`, ConversationSchema),
  ask: (firmId, conversationId, question) =>
    request(
      'POST',
      `/advisory-firms/${firmId}/assistant/conversations/${conversationId}/messages`,
      AssistantMessageSchema,
      { question },
    ),
});

import {
  ConversationNotFoundError,
  type ConversationLog,
  type Message,
} from '@support-assistant/domain/ConversationLog';

export type GetConversation = (input: {
  firmId: number;
  userId: string;
  conversationId: string;
}) => Promise<{ id: string; firmId: number; messages: Message[] }>;

/** A conversation with its messages. Only its user can read it, and only from its firm. */
export const makeGetConversation =
  ({ log }: { log: ConversationLog }): GetConversation =>
  async ({ firmId, userId, conversationId }) => {
    const conversation = await log.find(conversationId);
    if (!conversation || conversation.firmId !== firmId || conversation.userId !== userId) {
      throw new ConversationNotFoundError(conversationId);
    }
    return { id: conversation.id, firmId, messages: await log.messages(conversationId) };
  };

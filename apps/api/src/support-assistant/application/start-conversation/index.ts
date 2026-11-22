import type { Conversation, ConversationLog } from '@support-assistant/domain/ConversationLog';

export class FirmNotFoundError extends Error {
  constructor(id: number) {
    super(`There is no advisory firm with id ${id}`);
  }
}

export type StartConversation = (input: {
  firmId: number;
  userId: string;
}) => Promise<Conversation>;

export const makeStartConversation =
  ({
    log,
    firmExists,
  }: {
    log: ConversationLog;
    firmExists: (id: number) => Promise<boolean>;
  }): StartConversation =>
  async ({ firmId, userId }) => {
    if (!(await firmExists(firmId))) throw new FirmNotFoundError(firmId);
    return log.start(firmId, userId);
  };

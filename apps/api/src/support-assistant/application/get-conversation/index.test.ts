import { ConversationNotFoundError } from '@support-assistant/domain/ConversationLog';
import { fakeLog } from '@support-assistant/testing/fakes';
import { describe, expect, it } from 'vitest';
import { makeGetConversation } from '.';

describe('getConversation', () => {
  const getConversation = makeGetConversation({ log: fakeLog() });
  const input = { firmId: 1, userId: 'u-1', conversationId: 'c-1' };

  it('returns the conversation with its messages', async () => {
    expect(await getConversation(input)).toEqual({ id: 'c-1', firmId: 1, messages: [] });
  });

  it('hides a conversation of another firm or another user', async () => {
    await expect(getConversation({ ...input, firmId: 2 })).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(getConversation({ ...input, userId: 'u-2' })).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
  });
});

import { fakeLog } from '@support-assistant/testing/fakes';
import { describe, expect, it } from 'vitest';
import { FirmNotFoundError, makeStartConversation } from '.';

describe('startConversation', () => {
  it('starts a conversation of the user about the firm', async () => {
    const log = fakeLog();
    const start = makeStartConversation({ log, firmExists: async () => true });

    expect(await start({ firmId: 7, userId: 'u-1' })).toMatchObject({ firmId: 7, userId: 'u-1' });
  });

  it('refuses a firm that does not exist', async () => {
    const log = fakeLog();
    const start = makeStartConversation({ log, firmExists: async () => false });

    await expect(start({ firmId: 999, userId: 'u-1' })).rejects.toBeInstanceOf(FirmNotFoundError);
    expect(log.start).not.toHaveBeenCalled();
  });
});

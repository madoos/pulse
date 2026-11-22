import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { Request } from './request';
import { createSupportAssistantApi } from './supportAssistant';

describe('support assistant api', () => {
  it('starts a conversation about a firm and asks in it', async () => {
    const request = vi.fn(() => of({})) as unknown as Request;
    const api = createSupportAssistantApi(request);

    await firstValueFrom(api.start(7));
    await firstValueFrom(api.ask(7, 'c-1', '¿IVA?'));

    expect(
      vi.mocked(request).mock.calls.map(([method, path, , body]) => [method, path, body]),
    ).toEqual([
      ['POST', '/advisory-firms/7/assistant/conversations', undefined],
      ['POST', '/advisory-firms/7/assistant/conversations/c-1/messages', { question: '¿IVA?' }],
    ]);
  });
});

import { of, throwError } from 'rxjs';
import type { Api } from '@shared/api';
import { ApiError } from '@shared/api';

type FakeApi = { [Entity in keyof Api]?: Partial<Api[Entity]> };

export const createFakeApi = ({ health, session }: FakeApi = {}): Api => ({
  health: { get: () => of({ status: 'ok' }), ...health },
  session: {
    get: () => throwError(() => new ApiError(401)),
    post: () => throwError(() => new ApiError(401)),
    delete: () => of(undefined),
    ...session,
  },
});

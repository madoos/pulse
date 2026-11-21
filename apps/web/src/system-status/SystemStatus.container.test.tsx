import type { Api } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { renderWithStore } from '@shared/testing/render';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SystemStatusContainer } from './SystemStatus.container';

describe('SystemStatusContainer', () => {
  it('checks the API on load and shows it is up', async () => {
    renderWithStore(<SystemStatusContainer />);

    expect(await screen.findByText('API operativa')).toBeInTheDocument();
  });

  it('shows the API is down and recovers on retry', async () => {
    const getHealth = vi
      .fn<Api['health']['get']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of({ status: 'ok' }));
    renderWithStore(<SystemStatusContainer />, {
      api: createFakeApi({ health: { get: getHealth } }),
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('API operativa')).toBeInTheDocument();
    expect(getHealth).toHaveBeenCalledTimes(2);
  });
});

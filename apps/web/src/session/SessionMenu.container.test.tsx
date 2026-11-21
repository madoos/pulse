import { createFakeApi } from '@shared/testing/api';
import { renderWithStore } from '@shared/testing/render';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SessionMenuContainer } from './SessionMenu.container';
import { sessionFound } from './session.slice';

const ana = { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' };

describe('SessionMenuContainer', () => {
  it('shows nothing without a session', () => {
    const { container } = renderWithStore(<SessionMenuContainer />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the user and logs out', async () => {
    const remove = vi.fn(() => of(undefined));
    const { store } = renderWithStore(<SessionMenuContainer />, {
      api: createFakeApi({ session: { delete: remove } }),
    });
    act(() => {
      store.dispatch(sessionFound(ana));
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(remove).toHaveBeenCalledOnce();
    expect(store.getState().session).toEqual({ status: 'anonymous', user: null });
    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
  });
});

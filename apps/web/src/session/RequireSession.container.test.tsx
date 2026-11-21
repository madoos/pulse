import { createStore } from '@app/store';
import type { Api } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { NEVER, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { RequireSessionContainer } from './RequireSession.container';

const ana = { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' };

const renderProtectedPage = (api: Api) =>
  render(
    <Provider store={createStore({ api })}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<p>Login</p>} />
          <Route element={<RequireSessionContainer />}>
            <Route path="/" element={<p>Contenido protegido</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('RequireSessionContainer', () => {
  it('shows the page when there is a session', async () => {
    renderProtectedPage(createFakeApi({ session: { get: () => of({ user: ana }) } }));

    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument();
  });

  it('sends a visitor without a session to the login', async () => {
    renderProtectedPage(createFakeApi());

    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('waits while the session is being checked', () => {
    renderProtectedPage(createFakeApi({ session: { get: () => NEVER } }));

    expect(screen.getByRole('status')).toHaveTextContent('Comprobando la sesión…');
  });
});

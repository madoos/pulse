import { createStore } from '@app/store';
import type { Api } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { App } from './App';

const ana = { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' };

const renderApp = (path: string, api: Api = createFakeApi()) =>
  render(
    <Provider store={createStore({ api })}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </Provider>,
  );

describe('App', () => {
  it('shows the title', async () => {
    renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'Pulse' })).toBeInTheDocument();
  });

  it('serves the login', async () => {
    renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('protects the home page', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('shows the system status and the user menu with a session', async () => {
    renderApp('/', createFakeApi({ session: { get: () => of({ user: ana }) } }));

    expect(await screen.findByText('API operativa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });
});

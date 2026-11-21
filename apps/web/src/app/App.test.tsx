import { createStore } from '@app/store';
import type { Api } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('serves the login, with the name of the app and no navigation', async () => {
    renderApp('/login');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Inicia sesión' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('protects the home page', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('shows the network overview and the user menu with a session', async () => {
    renderApp('/', createFakeApi({ session: { get: () => of({ user: ana }) } }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Vista de red' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
  });

  it('serves the frame of the detail of an advisory firm', async () => {
    renderApp('/advisory-firms/7', createFakeApi({ session: { get: () => of({ user: ana }) } }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Asesoría 7' }),
    ).toBeInTheDocument();
  });

  it('opens the advisory firms over the page from the sidebar', async () => {
    renderApp('/', createFakeApi({ session: { get: () => of({ user: ana }) } }));

    await userEvent.click(await screen.findByRole('link', { name: 'Asesorías' }));

    expect(await screen.findByRole('dialog', { name: 'Asesorías' })).toBeInTheDocument();
  });

  it('opens the advisory firms with the search of the page header', async () => {
    renderApp('/', createFakeApi({ session: { get: () => of({ user: ana }) } }));

    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Buscar asesoría' }),
      'gestor{Enter}',
    );

    const dialog = await screen.findByRole('dialog', { name: 'Asesorías' });
    expect(within(dialog).getByRole('searchbox', { name: 'Buscar asesoría' })).toHaveValue(
      'gestor',
    );
  });
});

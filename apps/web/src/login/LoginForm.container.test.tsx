import { createFakeApi } from '@shared/testing/api';
import { renderWithStore } from '@shared/testing/render';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { LoginFormContainer } from './LoginForm.container';

const ana = { id: '6f1c1e1a-1b2c-4d3e-8f4a-5b6c7d8e9f00', email: 'ana@example.com' };
const home = { '/': <p>Inicio</p> };

const fillAndSubmit = async (password: string) => {
  await userEvent.type(await screen.findByRole('textbox', { name: 'Email' }), 'ana@example.com');
  await userEvent.type(screen.getByLabelText('Contraseña'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
};

describe('LoginFormContainer', () => {
  it('goes home after logging in', async () => {
    renderWithStore(<LoginFormContainer />, {
      api: createFakeApi({ session: { post: () => of({ user: ana }) } }),
      path: '/login',
      routes: home,
    });

    await fillAndSubmit('correct horse');

    expect(await screen.findByText('Inicio')).toBeInTheDocument();
  });

  it('shows why the login failed', async () => {
    renderWithStore(<LoginFormContainer />, { path: '/login', routes: home });

    await fillAndSubmit('wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent('no son correctos');
  });

  it('sends a user with an active session straight home', async () => {
    renderWithStore(<LoginFormContainer />, {
      api: createFakeApi({ session: { get: () => of({ user: ana }) } }),
      path: '/login',
      routes: home,
    });

    expect(await screen.findByText('Inicio')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

const credentials = { email: 'ana@example.com', password: 'correct horse' };

describe('LoginForm', () => {
  it('submits the typed credentials', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm status="idle" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), credentials.email);
    await userEvent.type(screen.getByLabelText('Contraseña'), credentials.password);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onSubmit).toHaveBeenCalledWith(credentials);
  });

  it('submits with the Enter key', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm status="idle" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), credentials.email);
    await userEvent.type(screen.getByLabelText('Contraseña'), `${credentials.password}{Enter}`);

    expect(onSubmit).toHaveBeenCalledWith(credentials);
  });

  it('does not submit without the required fields', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm status="idle" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides the password and helps password managers', () => {
    render(<LoginForm status="idle" onSubmit={() => {}} />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'autocomplete',
      'username',
    );
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('shows no error until a login fails', () => {
    render(<LoginForm status="idle" onSubmit={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains wrong credentials', () => {
    render(<LoginForm status="rejected" onSubmit={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El email o la contraseña no son correctos',
    );
  });

  it('explains an unavailable API', () => {
    render(<LoginForm status="unavailable" onSubmit={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No se ha podido iniciar sesión');
  });

  it('cannot be submitted twice while logging in', () => {
    render(<LoginForm status="submitting" onSubmit={() => {}} />);

    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
  });
});

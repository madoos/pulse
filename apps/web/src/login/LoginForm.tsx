import { Button, Message, TextField } from '@pulse/design-system';
import { useState, type FormEvent } from 'react';
import type { LoginStatus } from './login.slice';
import styles from './login-form.module.scss';

export type LoginFormProps = {
  status: LoginStatus;
  onSubmit: (credentials: { email: string; password: string }) => void;
};

const errors: Partial<Record<LoginStatus, string>> = {
  rejected: 'El email o la contraseña no son correctos.',
  unavailable: 'No se ha podido iniciar sesión. Inténtalo de nuevo en unos minutos.',
};

export const LoginForm = ({ status, onSubmit }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submitting = status === 'submitting';
  const error = errors[status];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form className={styles['login-form']} onSubmit={submit} aria-labelledby="login-title">
      <header className={styles['login-form__header']}>
        <h1 id="login-title" className={styles['login-form__title']}>
          Inicia sesión
        </h1>
        <p className={styles['login-form__subtitle']}>Entra con tu email y tu contraseña.</p>
      </header>
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="username"
        isRequired
        value={email}
        onChange={setEmail}
      />
      <TextField
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="current-password"
        isRequired
        value={password}
        onChange={setPassword}
      />
      {error ? <Message tone="error" title={error} /> : null}
      <Button type="submit" isDisabled={submitting}>
        {submitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
};

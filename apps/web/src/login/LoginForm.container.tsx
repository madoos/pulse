import { useAppDispatch, useAppSelector } from '@app/store';
import { sessionRequested } from '@session/session.slice';
import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { LoginForm } from './LoginForm';
import { LoginScreen } from './LoginScreen';
import { loginRequested } from './login.slice';

export const LoginFormContainer = () => {
  const session = useAppSelector((state) => state.session.status);
  const login = useAppSelector((state) => state.login.status);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (session === 'unknown') dispatch(sessionRequested());
  }, [session, dispatch]);

  if (session === 'authenticated') return <Navigate to="/" replace />;

  return (
    <LoginScreen>
      <LoginForm status={login} onSubmit={(credentials) => dispatch(loginRequested(credentials))} />
    </LoginScreen>
  );
};

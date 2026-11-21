import { useAppDispatch, useAppSelector } from '@app/store';
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { sessionRequested } from './session.slice';

export const RequireSessionContainer = () => {
  const status = useAppSelector((state) => state.session.status);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === 'unknown') dispatch(sessionRequested());
  }, [status, dispatch]);

  if (status === 'anonymous') return <Navigate to="/login" replace />;
  if (status !== 'authenticated') return <p role="status">Comprobando la sesión…</p>;

  return <Outlet />;
};

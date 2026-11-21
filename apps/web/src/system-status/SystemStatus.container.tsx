import { useAppDispatch, useAppSelector } from '@app/store';
import { useEffect } from 'react';
import { SystemStatus } from './SystemStatus';
import { checkRequested } from './systemStatus.slice';

export const SystemStatusContainer = () => {
  const status = useAppSelector((state) => state.systemStatus.status);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkRequested());
  }, [dispatch]);

  return <SystemStatus status={status} onRetry={() => dispatch(checkRequested())} />;
};

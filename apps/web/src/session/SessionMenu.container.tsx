import { useAppDispatch, useAppSelector } from '@app/store';
import { SessionMenu } from './SessionMenu';
import { logOutRequested } from './session.slice';

export const SessionMenuContainer = () => {
  const user = useAppSelector((state) => state.session.user);
  const dispatch = useAppDispatch();

  if (!user) return null;

  return <SessionMenu email={user.email} onLogOut={() => dispatch(logOutRequested())} />;
};

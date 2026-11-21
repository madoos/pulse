import { Button } from '@pulse/design-system';
import styles from './session-menu.module.scss';

export type SessionMenuProps = {
  email: string;
  onLogOut: () => void;
};

export const SessionMenu = ({ email, onLogOut }: SessionMenuProps) => (
  <div className={styles['session-menu']}>
    <span className={styles['session-menu__email']}>{email}</span>
    <Button variant="secondary" onPress={onLogOut}>
      Cerrar sesión
    </Button>
  </div>
);

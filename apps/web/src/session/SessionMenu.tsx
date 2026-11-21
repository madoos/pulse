import { Button } from '@pulse/design-system';
import styles from './session-menu.module.scss';

export type SessionMenuProps = {
  email: string;
  onLogOut: () => void;
};

export const SessionMenu = ({ email, onLogOut }: SessionMenuProps) => (
  <div className={styles['session-menu']}>
    <div className={styles['session-menu__user']}>
      <span className={styles['session-menu__label']}>Sesión iniciada como</span>
      <span className={styles['session-menu__email']} title={email}>
        {email}
      </span>
    </div>
    <Button variant="secondary" onPress={onLogOut}>
      Cerrar sesión
    </Button>
  </div>
);

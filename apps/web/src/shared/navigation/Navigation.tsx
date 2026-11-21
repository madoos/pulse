import { NavLink } from 'react-router';
import styles from './navigation.module.scss';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${styles.navigation__link} ${isActive ? styles['navigation__link--active'] : ''}`;

export const Navigation = () => (
  <nav className={styles.navigation} aria-label="Principal">
    <NavLink to="/" end className={linkClass}>
      Vista de red
    </NavLink>
  </nav>
);

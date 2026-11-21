import type { FirmReference } from '@pulse/contracts';
import { firmPath, fromState } from '@shared/navigation/firmLink';
import { Link, useLocation } from 'react-router';
import styles from './highlights.module.scss';

export const FirmLink = ({ firm }: { firm: FirmReference }) => {
  const location = useLocation();
  return (
    <div>
      <Link to={firmPath(firm.id)} state={fromState(location)} className={styles.highlights__link}>
        {firm.name}
      </Link>
      <div className={styles.highlights__meta}>
        {firm.specialty} · {firm.province}
      </div>
    </div>
  );
};

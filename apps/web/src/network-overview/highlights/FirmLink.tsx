import type { FirmReference } from '@pulse/contracts';
import { Link } from 'react-router';
import styles from './highlights.module.scss';

export const FirmLink = ({ firm }: { firm: FirmReference }) => (
  <div>
    <Link to={`/advisory-firms/${firm.id}`} className={styles.highlights__link}>
      {firm.name}
    </Link>
    <div className={styles.highlights__meta}>
      {firm.specialty} · {firm.province}
    </div>
  </div>
);

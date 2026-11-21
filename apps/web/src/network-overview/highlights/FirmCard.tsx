import type { FirmReference } from '@pulse/contracts';
import type { ReactNode } from 'react';
import { FirmLink } from './FirmLink';
import styles from './highlights.module.scss';

export type FirmCardProps = {
  firm: FirmReference;
  tone?: 'danger' | 'success';
  children: ReactNode;
};

/** A square for one advisory firm: its name, linking to its detail, and why it is there. */
export const FirmCard = ({ firm, tone = 'danger', children }: FirmCardProps) => {
  const toneClass = styles[`highlights__card--${tone}`];
  return (
    <li className={`${styles.highlights__card} ${toneClass}`}>
      <FirmLink firm={firm} />
      <div className={styles['highlights__card-body']}>{children}</div>
    </li>
  );
};

export const FirmCards = ({ label, children }: { label: string; children: ReactNode }) => (
  <ul className={styles.highlights__cards} aria-label={label}>
    {children}
  </ul>
);

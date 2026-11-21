import type { ReactNode } from 'react';
import styles from './stat-card.module.scss';

export type StatCardProps = {
  label: string;
  value: string;
  /** For example a Delta against another period. */
  change?: ReactNode;
  /** For example a Sparkline of the period. */
  chart?: ReactNode;
  /** How the value is calculated. */
  footnote?: ReactNode;
};

export const StatCard = ({ label, value, change, chart, footnote }: StatCardProps) => (
  <article className={styles['stat-card']} aria-label={label}>
    <h3 className={styles['stat-card__label']}>{label}</h3>
    <p className={styles['stat-card__value']}>{value}</p>
    {change && <div className={styles['stat-card__change']}>{change}</div>}
    {chart && <div className={styles['stat-card__chart']}>{chart}</div>}
    {footnote && <p className={styles['stat-card__footnote']}>{footnote}</p>}
  </article>
);

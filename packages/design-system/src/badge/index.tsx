import type { ReactNode } from 'react';
import styles from './badge.module.scss';

export type BadgeProps = {
  tone?: 'neutral' | 'danger' | 'success';
  children: ReactNode;
};

export const Badge = ({ tone = 'neutral', children }: BadgeProps) => {
  const toneClass = styles[`badge--${tone}`];
  return <span className={`${styles.badge} ${toneClass}`}>{children}</span>;
};

import type { ReactNode } from 'react';
import styles from './delta.module.scss';

export type DeltaProps = {
  /** Where the value moved. */
  direction: 'up' | 'down' | 'flat';
  /** Whether that move is good or bad news: a churn going down is good. */
  tone: 'good' | 'bad' | 'neutral';
  /** The change as text, with its sign, for example "+21,2 % vs 2024-25". */
  children: ReactNode;
};

const arrows = { up: '▲', down: '▼', flat: '▬' };

export const Delta = ({ direction, tone, children }: DeltaProps) => {
  const toneClass = styles[`delta--${tone}`];
  return (
    <span className={`${styles.delta} ${toneClass}`}>
      <span className={styles.delta__arrow} aria-hidden="true">
        {arrows[direction]}
      </span>
      {children}
    </span>
  );
};

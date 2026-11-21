import type { ReactNode } from 'react';
import styles from './message.module.scss';

export type MessageProps = {
  /** An error is announced right away; information is announced politely. */
  tone?: 'info' | 'error';
  title: string;
  children?: ReactNode;
  /** For example a retry button. */
  action?: ReactNode;
};

export const Message = ({ tone = 'info', title, children, action }: MessageProps) => {
  const toneClass = styles[`message--${tone}`];
  return (
    <div className={`${styles.message} ${toneClass}`} role={tone === 'error' ? 'alert' : 'status'}>
      <p className={styles.message__title}>{title}</p>
      {children && <div className={styles.message__body}>{children}</div>}
      {action && <div className={styles.message__action}>{action}</div>}
    </div>
  );
};

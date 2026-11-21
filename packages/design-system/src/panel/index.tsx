import { useId, type ReactNode } from 'react';
import styles from './panel.module.scss';

export type PanelProps = {
  title: string;
  description?: ReactNode;
  /** Shown next to the title, for example a counter. */
  aside?: ReactNode;
  /** Highlights a panel that asks for attention. */
  tone?: 'default' | 'danger';
  headingLevel?: 2 | 3;
  children: ReactNode;
};

export const Panel = ({
  title,
  description,
  aside,
  tone = 'default',
  headingLevel = 2,
  children,
}: PanelProps) => {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  const toneClass = styles[`panel--${tone}`];
  return (
    <section className={`${styles.panel} ${toneClass}`} aria-labelledby={titleId}>
      <header className={styles.panel__header}>
        <div>
          <Heading id={titleId} className={styles.panel__title}>
            {title}
          </Heading>
          {description && <p className={styles.panel__description}>{description}</p>}
        </div>
        {aside && <div className={styles.panel__aside}>{aside}</div>}
      </header>
      {children}
    </section>
  );
};

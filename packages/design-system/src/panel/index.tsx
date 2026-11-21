import { useId, useState, type ReactNode } from 'react';
import { Button } from 'react-aria-components';
import styles from './panel.module.scss';

export type PanelProps = {
  title: string;
  description?: ReactNode;
  /** Shown next to the title, for example a counter. */
  aside?: ReactNode;
  /** Highlights a panel that asks for attention. */
  tone?: 'default' | 'danger';
  headingLevel?: 2 | 3;
  /** The title opens and closes the content. */
  collapsible?: boolean;
  /** Whether a collapsible panel starts open. */
  defaultExpanded?: boolean;
  /** Shown instead of the content while a collapsible panel is closed. */
  summary?: ReactNode;
  children: ReactNode;
};

export const Panel = ({
  title,
  description,
  aside,
  tone = 'default',
  headingLevel = 2,
  collapsible = false,
  defaultExpanded = false,
  summary,
  children,
}: PanelProps) => {
  const titleId = useId();
  const contentId = useId();
  const [expanded, setExpanded] = useState(!collapsible || defaultExpanded);
  const Heading = `h${headingLevel}` as const;
  const toneClass = styles[`panel--${tone}`];
  return (
    <section className={`${styles.panel} ${toneClass}`} aria-labelledby={titleId}>
      <header className={styles.panel__header}>
        <div>
          <Heading id={titleId} className={styles.panel__title}>
            {collapsible ? (
              <Button
                className={styles.panel__toggle}
                aria-expanded={expanded}
                aria-controls={contentId}
                onPress={() => setExpanded(!expanded)}
              >
                <span className={styles.panel__chevron} data-expanded={expanded} aria-hidden="true">
                  ›
                </span>
                {title}
              </Button>
            ) : (
              title
            )}
          </Heading>
          {description && <p className={styles.panel__description}>{description}</p>}
        </div>
        {aside && <div className={styles.panel__aside}>{aside}</div>}
      </header>
      {!expanded && summary && <div className={styles.panel__summary}>{summary}</div>}
      <div id={contentId} className={styles.panel__content} hidden={!expanded}>
        {children}
      </div>
    </section>
  );
};

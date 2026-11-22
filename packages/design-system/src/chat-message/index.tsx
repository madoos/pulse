import type { ReactNode } from 'react';
import styles from './chat-message.module.scss';

export type ChatSource = {
  id: string;
  /** What kind of document it is and when: "Ticket · 3 nov 2025". */
  description: string;
  title: string;
};

export type ChatMessageProps = {
  author: 'user' | 'assistant';
  /** A notice is an answer without content, such as "there is not enough information". */
  tone?: 'default' | 'notice' | 'error';
  /** Waiting for the answer. */
  isPending?: boolean;
  pendingLabel?: string;
  sources?: ChatSource[];
  sourcesLabel?: string;
  children?: ReactNode;
};

/** A message of a conversation with an assistant, with the documents it is based on. */
export const ChatMessage = ({
  author,
  tone = 'default',
  isPending = false,
  pendingLabel = 'Pensando…',
  sources = [],
  sourcesLabel = 'Fuentes',
  children,
}: ChatMessageProps) => (
  <article
    className={[
      styles['chat-message'],
      styles[`chat-message--${author}`],
      styles[`chat-message--${tone}`],
    ].join(' ')}
    aria-label={author === 'user' ? 'Tu pregunta' : 'Respuesta'}
    aria-busy={isPending || undefined}
  >
    {isPending ? (
      <p className={styles['chat-message__pending']}>
        <span className={styles['chat-message__dots']} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {pendingLabel}
      </p>
    ) : (
      <div className={styles['chat-message__text']}>{children}</div>
    )}
    {sources.length > 0 && (
      <section className={styles['chat-message__sources']} aria-label={sourcesLabel}>
        <h3 className={styles['chat-message__sources-title']}>{sourcesLabel}</h3>
        <ul className={styles['chat-message__source-list']}>
          {sources.map((source) => (
            <li key={source.id} className={styles['chat-message__source']}>
              <span className={styles['chat-message__source-id']}>{source.id}</span>
              <span className={styles['chat-message__source-description']}>
                {source.description}
              </span>
              <span className={styles['chat-message__source-title']}>{source.title}</span>
            </li>
          ))}
        </ul>
      </section>
    )}
  </article>
);

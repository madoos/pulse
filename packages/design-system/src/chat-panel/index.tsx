import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react';
import { Button, Input, TextField } from 'react-aria-components';
import styles from './chat-panel.module.scss';

export type ChatPanelProps = {
  id?: string;
  title: string;
  /** A short tag next to the title, such as "Beta". */
  badge?: string;
  /** Under the title, for example what the assistant knows about. */
  description?: ReactNode;
  onClose: () => void;
  /** The text being written, and what to do when it changes or is sent. */
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder: string;
  /** While an answer is on its way, nothing else can be sent. */
  isBusy?: boolean;
  /** Nothing can be written, for example while the assistant is unavailable. */
  isDisabled?: boolean;
  /** Questions to start with, shown while there are no messages. */
  suggestions?: { label: string; items: string[]; onSelect: (item: string) => void };
  /** The messages, oldest first. */
  children?: ReactNode;
};

/**
 * A floating chat window at the bottom right of the page, which does not block it: the page can
 * still be read and used while it is open. Escape and its button close it.
 */
export const ChatPanel = ({
  id,
  title,
  badge,
  description,
  onClose,
  value,
  onChange,
  onSubmit,
  placeholder,
  isBusy = false,
  isDisabled = false,
  suggestions,
  children,
}: ChatPanelProps) => {
  const titleId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [children]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (text && !isBusy && !isDisabled) onSubmit(text);
  };

  return (
    <section
      id={id}
      className={styles['chat-panel']}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <header className={styles['chat-panel__header']}>
        <div className={styles['chat-panel__heading']}>
          <h2 id={titleId} className={styles['chat-panel__title']}>
            {title}
            {badge && (
              <>
                {' '}
                <span className={styles['chat-panel__badge']}>{badge}</span>
              </>
            )}
          </h2>
          {description && <p className={styles['chat-panel__description']}>{description}</p>}
        </div>
        <Button className={styles['chat-panel__close']} aria-label="Cerrar" onPress={onClose}>
          <span aria-hidden="true">✕</span>
        </Button>
      </header>
      <div
        ref={logRef}
        className={styles['chat-panel__log']}
        role="log"
        aria-label="Conversación"
        aria-live="polite"
      >
        {children}
        {suggestions && suggestions.items.length > 0 && (
          <section className={styles['chat-panel__suggestions']} aria-label={suggestions.label}>
            <h3 className={styles['chat-panel__suggestions-title']}>{suggestions.label}</h3>
            <ul className={styles['chat-panel__suggestion-list']}>
              {suggestions.items.map((item) => (
                <li key={item}>
                  <Button
                    className={styles['chat-panel__suggestion']}
                    isDisabled={isBusy || isDisabled}
                    onPress={() => suggestions.onSelect(item)}
                  >
                    {item}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <form className={styles['chat-panel__composer']} onSubmit={send}>
        <TextField
          className={styles['chat-panel__field']}
          aria-label={placeholder}
          value={value}
          onChange={onChange}
          isDisabled={isDisabled}
          maxLength={500}
        >
          <Input ref={inputRef} className={styles['chat-panel__input']} placeholder={placeholder} />
        </TextField>
        <Button
          type="submit"
          className={styles['chat-panel__send']}
          aria-label="Enviar"
          isDisabled={isBusy || isDisabled || !value.trim()}
        >
          <span aria-hidden="true">➤</span>
        </Button>
      </form>
    </section>
  );
};

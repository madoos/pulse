import { useState } from 'react';
import {
  Button,
  Input,
  Label,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
} from 'react-aria-components';
import styles from './search-field.module.scss';

export type SearchFieldProps = Omit<AriaSearchFieldProps, 'className' | 'style' | 'children'> & {
  label: string;
  placeholder?: string;
  /** Hides the label, which stays for screen readers. Use it only when the context is obvious. */
  hideLabel?: boolean;
  /**
   * A visible button that searches, as Enter does, for a search that only runs when it is sent.
   * Without it, nothing tells the user that Enter is needed.
   */
  submitLabel?: string;
};

export const SearchField = ({
  label,
  placeholder,
  hideLabel,
  submitLabel,
  value,
  defaultValue = '',
  onChange,
  onSubmit,
  ...props
}: SearchFieldProps) => {
  // Kept here as well, so the button can send what is written even when the field is uncontrolled.
  const [text, setText] = useState(value ?? defaultValue);
  const current = value ?? text;
  const field = (
    <AriaSearchField
      {...props}
      value={current}
      onChange={(next) => {
        setText(next);
        onChange?.(next);
      }}
      onSubmit={onSubmit}
      className={styles['search-field']}
    >
      <Label
        className={
          hideLabel ? styles['search-field__label--hidden'] : styles['search-field__label']
        }
      >
        {label}
      </Label>
      <div className={styles['search-field__box']}>
        <svg className={styles['search-field__icon']} viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <Input className={styles['search-field__input']} placeholder={placeholder} />
        <Button className={styles['search-field__clear']} aria-label="Borrar la búsqueda">
          <span aria-hidden="true">✕</span>
        </Button>
      </div>
    </AriaSearchField>
  );
  if (!submitLabel) return field;
  // The button goes outside the field: inside it, React Aria would make it clear the text.
  return (
    <div className={styles['search-field__with-submit']}>
      {field}
      <Button
        className={styles['search-field__submit']}
        isDisabled={props.isDisabled}
        onPress={() => onSubmit?.(current)}
      >
        {submitLabel}
      </Button>
    </div>
  );
};

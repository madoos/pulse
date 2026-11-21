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
};

export const SearchField = ({ label, placeholder, hideLabel, ...props }: SearchFieldProps) => (
  <AriaSearchField {...props} className={styles['search-field']}>
    <Label
      className={hideLabel ? styles['search-field__label--hidden'] : styles['search-field__label']}
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

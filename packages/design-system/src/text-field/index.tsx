import {
  FieldError,
  Input,
  Label,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import styles from './text-field.module.scss';

export type TextFieldProps = Omit<AriaTextFieldProps, 'className' | 'style' | 'children'> & {
  label: string;
  errorMessage?: string;
};

export const TextField = ({ label, errorMessage, ...props }: TextFieldProps) => (
  <AriaTextField {...props} className={styles['text-field']}>
    <Label className={styles['text-field__label']}>{label}</Label>
    <Input className={styles['text-field__input']} />
    <FieldError className={styles['text-field__error']}>{errorMessage}</FieldError>
  </AriaTextField>
);

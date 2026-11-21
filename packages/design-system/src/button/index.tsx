import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import styles from './button.module.scss';

export type ButtonProps = Omit<AriaButtonProps, 'className' | 'style'> & {
  variant?: 'primary' | 'secondary';
};

export const Button = ({ variant = 'primary', ...props }: ButtonProps) => (
  <AriaButton {...props} className={`${styles.button} ${styles[`button--${variant}`]}`} />
);

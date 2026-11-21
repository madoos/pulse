import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import styles from './button.module.scss';

export type ButtonProps = Omit<AriaButtonProps, 'className' | 'style'> & {
  variant?: 'primary' | 'secondary';
};

export const Button = ({ variant = 'primary', ...props }: ButtonProps) => {
  const variantClass = styles[`button--${variant}`];
  return <AriaButton {...props} className={`${styles.button} ${variantClass}`} />;
};

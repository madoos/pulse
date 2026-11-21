import logo from './asevia-logo-white.png';
import styles from './brand.module.scss';

export type BrandProps = {
  /** Larger on the login, smaller in the sidebar. */
  size?: 'small' | 'large';
};

/** The logo of Asevia with the name of the application, on a dark surface. */
export const Brand = ({ size = 'small' }: BrandProps) => {
  const sizeClass = styles[`brand--${size}`];
  return (
    <span className={`${styles.brand} ${sizeClass}`}>
      <img className={styles.brand__logo} src={logo} alt="Asevia" />
      <span className={styles.brand__product}>Pulse</span>
    </span>
  );
};

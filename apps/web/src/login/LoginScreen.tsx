import type { ReactNode } from 'react';
import { Brand } from '@shared/brand/Brand';
import styles from './login-screen.module.scss';

const FEATURES = [
  'Los indicadores de toda la red, año contra año',
  'Las asesorías que necesitan atención, en cuanto lo necesitan',
  'El detalle de cada asesoría, mes a mes',
];

/** The page of the login: what the application is on one side, the form on the other. */
export const LoginScreen = ({ children }: { children: ReactNode }) => (
  <div className={styles['login-screen']}>
    <aside className={styles['login-screen__brand']}>
      <Brand size="large" />
      <div className={styles['login-screen__pitch']}>
        <p className={styles['login-screen__tagline']}>La red de asesorías, de un vistazo.</p>
        <ul className={styles['login-screen__features']}>
          {FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
    </aside>
    <main className={styles['login-screen__main']}>{children}</main>
  </div>
);

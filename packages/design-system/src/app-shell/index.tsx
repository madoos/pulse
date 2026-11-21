import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-aria-components';
import styles from './app-shell.module.scss';

export type AppShellProps = {
  /** The name of the application, at the top of the sidebar. */
  brand: ReactNode;
  /** The links of the sidebar, usually `SideNavLink`s. */
  navigation?: ReactNode;
  /** Who is logged in, at the bottom of the sidebar. */
  user?: ReactNode;
  children: ReactNode;
};

/** The frame of every page: a sidebar with the brand, the navigation and the user, and the content. */
export const AppShell = ({ brand, navigation, user, children }: AppShellProps) => (
  <div className={styles['app-shell']}>
    <aside className={styles['app-shell__sidebar']}>
      <div className={styles['app-shell__brand']}>{brand}</div>
      {navigation && (
        <nav className={styles['app-shell__navigation']} aria-label="Principal">
          {navigation}
        </nav>
      )}
      {user && <div className={styles['app-shell__user']}>{user}</div>}
    </aside>
    <main className={styles['app-shell__main']}>{children}</main>
  </div>
);

export type SideNavLinkProps = Omit<LinkProps, 'className' | 'style' | 'children'> & {
  /** The link of the page being shown. */
  isCurrent?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

/** A link of the sidebar. Give it an `href`: with a router provider it navigates in the app. */
export const SideNavLink = ({ isCurrent = false, icon, children, ...props }: SideNavLinkProps) => (
  <Link
    {...props}
    aria-current={isCurrent ? 'page' : undefined}
    className={styles['app-shell__link']}
  >
    {icon && (
      <span className={styles['app-shell__icon']} aria-hidden="true">
        {icon}
      </span>
    )}
    {children}
  </Link>
);

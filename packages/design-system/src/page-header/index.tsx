import type { ReactNode } from 'react';
import styles from './page-header.module.scss';

export type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Above the title, for example a link back. */
  back?: ReactNode;
  /** Next to the title, for example a search field or a button. */
  actions?: ReactNode;
};

/** The top of a page: its title, the one h1 of the page. */
export const PageHeader = ({ title, description, back, actions }: PageHeaderProps) => (
  <header className={styles['page-header']}>
    {back && <div className={styles['page-header__back']}>{back}</div>}
    <div className={styles['page-header__row']}>
      <div>
        <h1 className={styles['page-header__title']}>{title}</h1>
        {description && <p className={styles['page-header__description']}>{description}</p>}
      </div>
      {actions && <div className={styles['page-header__actions']}>{actions}</div>}
    </div>
  </header>
);

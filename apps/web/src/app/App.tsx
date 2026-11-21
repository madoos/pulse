import { SystemStatusContainer } from '@system-status/SystemStatus.container';
import { Route, Routes } from 'react-router';
import styles from './app.module.scss';

export const App = () => (
  <div className={styles.app}>
    <header className={styles.app__header}>
      <h1 className={styles.app__title}>Pulse</h1>
    </header>
    <main className={styles.app__main}>
      <Routes>
        <Route path="/" element={<SystemStatusContainer />} />
      </Routes>
    </main>
  </div>
);

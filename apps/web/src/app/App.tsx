import { LoginFormContainer } from '@login/LoginForm.container';
import { RequireSessionContainer } from '@session/RequireSession.container';
import { SessionMenuContainer } from '@session/SessionMenu.container';
import { SystemStatusContainer } from '@system-status/SystemStatus.container';
import { Route, Routes } from 'react-router';
import styles from './app.module.scss';

export const App = () => (
  <div className={styles.app}>
    <header className={styles.app__header}>
      <h1 className={styles.app__title}>Pulse</h1>
      <SessionMenuContainer />
    </header>
    <main className={styles.app__main}>
      <Routes>
        <Route path="/login" element={<LoginFormContainer />} />
        <Route element={<RequireSessionContainer />}>
          <Route path="/" element={<SystemStatusContainer />} />
        </Route>
      </Routes>
    </main>
  </div>
);

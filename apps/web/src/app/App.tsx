import { LoginFormContainer } from '@login/LoginForm.container';
import { NetworkOverviewContainer } from '@network-overview/NetworkOverview.container';
import { RequireSessionContainer } from '@session/RequireSession.container';
import { SessionMenuContainer } from '@session/SessionMenu.container';
import { Navigation } from '@shared/navigation/Navigation';
import { Route, Routes } from 'react-router';
import styles from './app.module.scss';

export const App = () => (
  <div className={styles.app}>
    <header className={styles.app__header}>
      <p className={styles.app__title}>Pulse</p>
      <Navigation />
      <SessionMenuContainer />
    </header>
    <main className={styles.app__main}>
      <Routes>
        <Route path="/login" element={<LoginFormContainer />} />
        <Route element={<RequireSessionContainer />}>
          <Route path="/" element={<NetworkOverviewContainer />} />
        </Route>
      </Routes>
    </main>
  </div>
);

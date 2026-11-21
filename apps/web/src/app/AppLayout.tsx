import { FirmsDrawerContainer } from '@advisory-firms/FirmsDrawer.container';
import { AppShell } from '@pulse/design-system';
import { SessionMenuContainer } from '@session/SessionMenu.container';
import { Brand } from '@shared/brand/Brand';
import { Navigation } from '@shared/navigation/Navigation';
import { Outlet } from 'react-router';

/** The frame of the pages behind the login, with the drawer of advisory firms over them. */
export const AppLayout = () => (
  <AppShell brand={<Brand />} navigation={<Navigation />} user={<SessionMenuContainer />}>
    <Outlet />
    <FirmsDrawerContainer />
  </AppShell>
);

import { AdvisoryFirmDetailContainer } from '@advisory-firm-detail/AdvisoryFirmDetail.container';
import { LoginFormContainer } from '@login/LoginForm.container';
import { NetworkOverviewContainer } from '@network-overview/NetworkOverview.container';
import { RequireSessionContainer } from '@session/RequireSession.container';
import { LinkRouter } from '@pulse/design-system';
import { Route, Routes, useHref, useNavigate } from 'react-router';
import { AppLayout } from './AppLayout';

export const App = () => {
  const navigate = useNavigate();
  // The links of the design system navigate inside the app instead of reloading the page.
  return (
    <LinkRouter navigate={navigate} useHref={useHref}>
      <Routes>
        <Route path="/login" element={<LoginFormContainer />} />
        <Route element={<RequireSessionContainer />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<NetworkOverviewContainer />} />
            <Route path="/advisory-firms/:id" element={<AdvisoryFirmDetailContainer />} />
          </Route>
        </Route>
      </Routes>
    </LinkRouter>
  );
};

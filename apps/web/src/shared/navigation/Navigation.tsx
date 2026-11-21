import { firmsDrawerHref } from '@advisory-firms/firmsDrawer.url';
import { SideNavLink } from '@pulse/design-system';
import { useLocation, useSearchParams } from 'react-router';

/** The links of the sidebar. The advisory firms open in a drawer over the current page. */
export const Navigation = () => {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  return (
    <>
      <SideNavLink href="/" isCurrent={pathname === '/'} icon={<OverviewIcon />}>
        Vista de red
      </SideNavLink>
      <SideNavLink
        href={firmsDrawerHref(pathname, params)}
        isCurrent={pathname.startsWith('/advisory-firms/')}
        icon={<FirmsIcon />}
      >
        Asesorías
      </SideNavLink>
    </>
  );
};

const OverviewIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
    <rect x="2" y="2" width="7" height="7" rx="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1.5" />
    <rect x="11" y="11" width="7" height="7" rx="1.5" />
  </svg>
);

const FirmsIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
    <rect x="2" y="3" width="16" height="3" rx="1.5" />
    <rect x="2" y="8.5" width="16" height="3" rx="1.5" />
    <rect x="2" y="14" width="16" height="3" rx="1.5" />
  </svg>
);

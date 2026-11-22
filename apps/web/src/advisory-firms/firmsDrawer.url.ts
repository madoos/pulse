import { useSearchParams } from 'react-router';

/** The drawer of advisory firms lives in the URL, over any page: `?firms=open&q=…&province=…`. */
export const FIRMS_PARAM = 'firms';

export const FIRM_FILTERS = ['province', 'specialty'] as const;

export type FirmFilter = (typeof FIRM_FILTERS)[number];

export type FirmsDrawerState = {
  isOpen: boolean;
  search: string;
  filters: Record<FirmFilter, string | null>;
};

const DRAWER_PARAMS = [FIRMS_PARAM, 'q', ...FIRM_FILTERS];

export const readFirmsDrawer = (params: URLSearchParams): FirmsDrawerState => ({
  isOpen: params.get(FIRMS_PARAM) === 'open',
  search: params.get('q') ?? '',
  filters: {
    province: params.get('province'),
    specialty: params.get('specialty'),
  },
});

export type FirmsDrawerChange = { search?: string } & Partial<Record<FirmFilter, string | null>>;

/** The params with the drawer open and the change applied. Empty values leave the URL. */
export const openFirmsDrawer = (params: URLSearchParams, change: FirmsDrawerChange = {}) => {
  const next = new URLSearchParams(params);
  next.set(FIRMS_PARAM, 'open');
  const { search, ...filters } = change;
  const values: [string, string | null | undefined][] = [['q', search], ...Object.entries(filters)];
  for (const [key, value] of values) {
    if (value === undefined) continue;
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
};

/** The params without the drawer, its search or its filters. */
export const closeFirmsDrawer = (params: URLSearchParams) => {
  const next = new URLSearchParams(params);
  for (const key of DRAWER_PARAMS) next.delete(key);
  return next;
};

/** The link that opens the drawer over the page being shown. */
export const firmsDrawerHref = (pathname: string, params: URLSearchParams) =>
  `${pathname}?${openFirmsDrawer(params).toString()}`;

export const useFirmsDrawer = () => {
  const [params, setParams] = useSearchParams();
  return {
    ...readFirmsDrawer(params),
    open: (change?: FirmsDrawerChange) => setParams(openFirmsDrawer(params, change)),
    // Typing replaces the entry, so going back does not undo it letter by letter.
    change: (change: FirmsDrawerChange) =>
      setParams(openFirmsDrawer(params, change), { replace: true }),
    close: () => setParams(closeFirmsDrawer(params)),
  };
};

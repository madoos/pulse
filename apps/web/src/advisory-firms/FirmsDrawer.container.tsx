import { useAppDispatch, useAppSelector } from '@app/store';
import { firmPath, fromState } from '@shared/navigation/firmLink';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router';
import { FirmsDrawer } from './FirmsDrawer';
import { useFirmsDrawer } from './firmsDrawer.url';
import {
  firmFiltersRequested,
  firmsListingClosed,
  firmsQueryChanged,
  firstPageRequested,
  nextPageRequested,
  type FirmsQuery,
} from './firmsListing.slice';

const provinceOf = (value: string | null) => {
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : null;
};

/** The drawer reads its query from the URL; the listing loads it page by page. */
export const FirmsDrawerContainer = () => {
  const { isOpen, search, filters, change, close } = useFirmsDrawer();
  const listing = useAppSelector((state) => state.firmsListing);
  const dispatch = useAppDispatch();
  const location = useLocation();

  const province = provinceOf(filters.province);
  const query = useMemo<FirmsQuery>(
    () => ({ search, province, specialty: filters.specialty }),
    [search, province, filters.specialty],
  );

  useEffect(() => {
    dispatch(isOpen ? firmsQueryChanged(query) : firmsListingClosed());
  }, [isOpen, query, dispatch]);

  const filtersStatus = listing.filters.status;
  useEffect(() => {
    if (isOpen && filtersStatus === 'idle') dispatch(firmFiltersRequested());
  }, [isOpen, filtersStatus, dispatch]);

  const options = listing.filters.data;
  return (
    <FirmsDrawer
      isOpen={isOpen}
      search={search}
      filters={filters}
      listing={{
        status: listing.status,
        items: listing.items,
        total: listing.total,
        hasMore: listing.nextCursor !== null,
        isLoadingMore: listing.isLoadingMore,
        moreFailed: listing.moreFailed,
      }}
      options={{
        province: (options?.provinces ?? []).map((p) => ({ id: String(p.id), label: p.name })),
        specialty: (options?.specialties ?? []).map((s) => ({ id: s.code, label: s.name })),
      }}
      firmHref={firmPath}
      // "Volver" in the detail returns to this page with the drawer as it was.
      routerOptions={{ state: fromState(location) }}
      onChange={change}
      onClose={close}
      onLoadMore={() => {
        const { query: shown, nextCursor, status } = listing;
        if (shown && nextCursor && status === 'loaded') {
          dispatch(nextPageRequested({ query: shown, cursor: nextCursor }));
        }
      }}
      onRetry={() => dispatch(firstPageRequested(query))}
    />
  );
};

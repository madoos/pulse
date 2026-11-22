import type { AdvisoryFirmFilters, AdvisoryFirmSummary, AdvisoryFirmsPage } from '@pulse/contracts';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'failed';

/** What the listing shows: the search and the filters of the drawer. */
export type FirmsQuery = { search: string; province: number | null; specialty: string | null };

export type NextPage = { query: FirmsQuery; cursor: string };

export type FirmsListingState = {
  /** The query of the pages shown, which lags behind the drawer while the user types. */
  query: FirmsQuery | null;
  status: LoadStatus;
  items: AdvisoryFirmSummary[];
  total: number;
  nextCursor: string | null;
  isLoadingMore: boolean;
  moreFailed: boolean;
  filters: { status: LoadStatus; data: AdvisoryFirmFilters | null };
};

const initialState: FirmsListingState = {
  query: null,
  status: 'idle',
  items: [],
  total: 0,
  nextCursor: null,
  isLoadingMore: false,
  moreFailed: false,
  filters: { status: 'idle', data: null },
};

export const firmsListingSlice = createSlice({
  name: 'firmsListing',
  initialState,
  reducers: {
    /** The drawer is open with this search and these filters. */
    firmsQueryChanged: {
      reducer: (state) => {
        state.status = 'loading';
      },
      prepare: (query: FirmsQuery) => ({ payload: query }),
    },
    firstPageRequested: (state, action: PayloadAction<FirmsQuery>) => {
      state.query = action.payload;
      state.status = 'loading';
      state.isLoadingMore = false;
      state.moreFailed = false;
    },
    firstPageLoaded: (state, action: PayloadAction<AdvisoryFirmsPage>) => {
      state.status = 'loaded';
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.nextCursor = action.payload.nextCursor;
    },
    firstPageFailed: (state) => {
      state.status = 'failed';
    },
    nextPageRequested: {
      reducer: (state) => {
        state.isLoadingMore = true;
        state.moreFailed = false;
      },
      prepare: (nextPage: NextPage) => ({ payload: nextPage }),
    },
    nextPageLoaded: (state, action: PayloadAction<AdvisoryFirmsPage>) => {
      state.isLoadingMore = false;
      state.items.push(...action.payload.items);
      state.total = action.payload.total;
      state.nextCursor = action.payload.nextCursor;
    },
    nextPageFailed: (state) => {
      state.isLoadingMore = false;
      state.moreFailed = true;
    },
    /** The drawer closed: the pages are dropped, the values to filter by are kept. */
    firmsListingClosed: (state) => ({ ...initialState, filters: state.filters }),
    firmFiltersRequested: (state) => {
      state.filters.status = 'loading';
    },
    firmFiltersLoaded: (state, action: PayloadAction<AdvisoryFirmFilters>) => {
      state.filters = { status: 'loaded', data: action.payload };
    },
    firmFiltersFailed: (state) => {
      state.filters.status = 'failed';
    },
  },
});

export const {
  firmsQueryChanged,
  firstPageRequested,
  firstPageLoaded,
  firstPageFailed,
  nextPageRequested,
  nextPageLoaded,
  nextPageFailed,
  firmsListingClosed,
  firmFiltersRequested,
  firmFiltersLoaded,
  firmFiltersFailed,
} = firmsListingSlice.actions;

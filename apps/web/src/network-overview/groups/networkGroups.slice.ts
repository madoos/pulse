import type { NetworkGroups, NetworkGroupsQuery } from '@pulse/contracts';
import type { TableSort } from '@pulse/design-system';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoadStatus } from '@network-overview/networkOverview.slice';

export type NetworkGroupsState = {
  status: LoadStatus;
  query: NetworkGroupsQuery | null;
  data: NetworkGroups | null;
  sort: TableSort;
};

const initialState: NetworkGroupsState = {
  status: 'idle',
  query: null,
  data: null,
  sort: { column: 'revenuePerFirm', direction: 'descending' },
};

export const networkGroupsSlice = createSlice({
  name: 'networkGroups',
  initialState,
  reducers: {
    groupsRequested: (state, action: PayloadAction<NetworkGroupsQuery>) => {
      state.status = 'loading';
      state.query = action.payload;
    },
    groupsLoaded: (state, action: PayloadAction<NetworkGroups>) => {
      state.status = 'loaded';
      state.data = action.payload;
    },
    groupsFailed: (state) => {
      state.status = 'failed';
    },
    groupsSorted: (state, action: PayloadAction<TableSort>) => {
      state.sort = action.payload;
    },
  },
});

export const { groupsRequested, groupsLoaded, groupsFailed, groupsSorted } =
  networkGroupsSlice.actions;

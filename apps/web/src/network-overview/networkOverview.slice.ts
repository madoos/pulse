import { createAction } from '@reduxjs/toolkit';
import type { NetworkFilters } from './networkOverview.filters';

/** The filters in the URL changed: every section loads what it needs. */
export const networkFiltersChanged = createAction<NetworkFilters>('networkOverview/filtersChanged');

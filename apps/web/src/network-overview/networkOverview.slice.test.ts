import { describe, expect, it } from 'vitest';
import {
  fiscalYearsFailed,
  fiscalYearsLoaded,
  fiscalYearsRequested,
  networkOverviewSlice,
} from './networkOverview.slice';

const reduce = networkOverviewSlice.reducer;

describe('network overview slice', () => {
  it('loads the fiscal years', () => {
    const loading = reduce(undefined, fiscalYearsRequested());

    expect(loading.status).toBe('loading');
    expect(reduce(loading, fiscalYearsLoaded([2025, 2024]))).toEqual({
      status: 'loaded',
      fiscalYears: [2025, 2024],
    });
  });

  it('fails when the fiscal years cannot be loaded', () => {
    expect(reduce(undefined, fiscalYearsFailed()).status).toBe('failed');
  });
});

import { describe, expect, it } from 'vitest';
import {
  fiscalYearsFailed,
  fiscalYearsLoaded,
  fiscalYearsRequested,
  fiscalYearsSlice,
} from './fiscalYears.slice';

const reduce = fiscalYearsSlice.reducer;

describe('fiscal years slice', () => {
  it('loads the fiscal years', () => {
    const loading = reduce(undefined, fiscalYearsRequested());

    expect(loading.status).toBe('loading');
    expect(reduce(loading, fiscalYearsLoaded([2025, 2024]))).toEqual({
      status: 'loaded',
      years: [2025, 2024],
    });
  });

  it('fails when the fiscal years cannot be loaded', () => {
    expect(reduce(undefined, fiscalYearsFailed()).status).toBe('failed');
  });
});

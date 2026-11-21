import { describe, expect, it } from 'vitest';
import {
  NetworkGroupsQuerySchema,
  NetworkPerformanceQuerySchema,
  PeriodQuerySchema,
  fiscalMonthIndex,
} from './network';

describe('fiscalMonthIndex', () => {
  it('places April first and March last', () => {
    expect(fiscalMonthIndex(4)).toBe(0);
    expect(fiscalMonthIndex(12)).toBe(8);
    expect(fiscalMonthIndex(1)).toBe(9);
    expect(fiscalMonthIndex(3)).toBe(11);
  });
});

describe('PeriodQuerySchema', () => {
  it('reads the query string and defaults to the whole fiscal year', () => {
    expect(PeriodQuerySchema.parse({ fiscalYear: '2025' })).toEqual({
      fiscalYear: 2025,
      fromMonth: 4,
      toMonth: 3,
    });
  });

  it('accepts a range in fiscal order, across the new year', () => {
    expect(
      PeriodQuerySchema.safeParse({ fiscalYear: 2025, fromMonth: 11, toMonth: 2 }).success,
    ).toBe(true);
  });

  it('rejects a range that goes backwards', () => {
    expect(
      PeriodQuerySchema.safeParse({ fiscalYear: 2025, fromMonth: 6, toMonth: 4 }).success,
    ).toBe(false);
  });

  it('rejects a month out of range', () => {
    expect(PeriodQuerySchema.safeParse({ fiscalYear: 2025, fromMonth: 13 }).success).toBe(false);
  });
});

describe('NetworkPerformanceQuerySchema', () => {
  it('compares with another fiscal year', () => {
    expect(
      NetworkPerformanceQuerySchema.parse({ fiscalYear: '2025', compareWith: '2024' }),
    ).toEqual({ fiscalYear: 2025, compareWith: 2024, fromMonth: 4, toMonth: 3 });
  });

  it('does not compare a fiscal year with itself', () => {
    expect(
      NetworkPerformanceQuerySchema.safeParse({ fiscalYear: 2025, compareWith: 2025 }).success,
    ).toBe(false);
  });
});

describe('NetworkGroupsQuerySchema', () => {
  it('groups by specialty or autonomous community only', () => {
    expect(
      NetworkGroupsQuerySchema.safeParse({ fiscalYear: 2025, groupBy: 'specialty' }).success,
    ).toBe(true);
    expect(
      NetworkGroupsQuerySchema.safeParse({ fiscalYear: 2025, groupBy: 'autonomous-community' })
        .success,
    ).toBe(true);
    expect(NetworkGroupsQuerySchema.safeParse({ fiscalYear: 2025, groupBy: 'city' }).success).toBe(
      false,
    );
  });
});

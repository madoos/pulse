import { describe, expect, it } from 'vitest';
import {
  fiscalYearOf,
  monthOf,
  monthsOf,
  sameMonthsIn,
  withComparedYear,
  addMonths,
} from './FiscalPeriod';

describe('FiscalPeriod', () => {
  it('places January to March in the following calendar year', () => {
    expect(monthOf(2025, 4)).toBe('2025-04');
    expect(monthOf(2025, 12)).toBe('2025-12');
    expect(monthOf(2025, 1)).toBe('2026-01');
    expect(monthOf(2025, 3)).toBe('2026-03');
  });

  it('knows the fiscal year of a month', () => {
    expect(fiscalYearOf('2025-04')).toBe(2025);
    expect(fiscalYearOf('2026-03')).toBe(2025);
    expect(fiscalYearOf('2026-04')).toBe(2026);
  });

  it('lists the months of the whole fiscal year from April to March', () => {
    const months = monthsOf({ fiscalYear: 2025, fromMonth: 4, toMonth: 3 });

    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2025-04');
    expect(months[11]).toBe('2026-03');
  });

  it('lists a range across the new year', () => {
    expect(monthsOf({ fiscalYear: 2025, fromMonth: 11, toMonth: 2 })).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
  });

  it('compares the same months of another year', () => {
    const period = { fiscalYear: 2025, fromMonth: 4, toMonth: 6 };

    expect(monthsOf(sameMonthsIn(period, 2024))).toEqual(['2024-04', '2024-05', '2024-06']);
    expect(withComparedYear(period)).toEqual([period]);
    expect(withComparedYear(period, 2024)).toEqual([period, { ...period, fiscalYear: 2024 }]);
  });
});

describe('addMonths', () => {
  it('moves across years in both directions', () => {
    expect(addMonths('2026-03', -6)).toBe('2025-09');
    expect(addMonths('2025-11', 3)).toBe('2026-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
});

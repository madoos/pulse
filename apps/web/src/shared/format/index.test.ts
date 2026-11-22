import { describe, expect, it } from 'vitest';
import {
  formatChange,
  formatCompactEuros,
  formatEuros,
  formatFiscalYear,
  formatMonth,
  formatMonthName,
  formatNumber,
  formatPercent,
  formatPoints,
  formatShortMonth,
  formatDate,
} from '.';

describe('format', () => {
  it('formats amounts and numbers with Spanish separators', () => {
    expect(formatEuros(35000)).toBe('35.000\u00a0€');
    expect(formatEuros(null)).toBe('n/d');
    expect(formatNumber(8148)).toBe('8.148');
  });

  it('formats ratios as percentages and changes with their sign', () => {
    expect(formatPercent(0.02)).toBe('2,0\u00a0%');
    expect(formatPercent(null)).toBe('n/d');
    expect(formatChange(0.2117)).toBe('+21,2\u00a0%');
    expect(formatChange(-0.1)).toBe('−10,0\u00a0%');
    expect(formatPoints(-0.003)).toBe('−0,3\u00a0p.p.');
  });

  it('formats compact amounts for axes', () => {
    expect(formatCompactEuros(1_600_000)).toBe('1,6\u00a0M');
    expect(formatCompactEuros(450_000)).toBe('450\u00a0k');
    expect(formatCompactEuros(200)).toBe('200');
  });

  it('names fiscal years and months', () => {
    expect(formatFiscalYear(2025)).toBe('2025-26');
    expect(formatFiscalYear(2099)).toBe('2099-00');
    expect(formatMonthName(4)).toBe('abril');
    expect(formatShortMonth(3)).toBe('mar');
    expect(formatMonth('2026-03')).toBe('mar 2026');
  });
});

describe('formatDate', () => {
  it('writes the day first', () => {
    expect(formatDate('2018-03-15')).toBe('15/03/2018');
  });
});

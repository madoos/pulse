import { describe, expect, it } from 'vitest';
import { deltaOf, valuesByMonth } from './metrics';

describe('metrics', () => {
  it('shows revenue going up as good news', () => {
    expect(deltaOf('revenue', 16_600_000, 13_700_000)).toEqual({
      direction: 'up',
      tone: 'good',
      text: '+21,2\u00a0% · antes 13.700.000\u00a0€',
    });
  });

  it('shows revenue per client going down as bad news', () => {
    expect(deltaOf('revenuePerClient', 90, 100)).toMatchObject({
      direction: 'down',
      tone: 'bad',
    });
  });

  it('shows churn in percentage points, going down as good news', () => {
    expect(deltaOf('churnRate', 0.015, 0.018)).toEqual({
      direction: 'down',
      tone: 'good',
      text: '−0,3\u00a0p.p. · antes 1,8\u00a0%',
    });
    expect(deltaOf('churnRate', 0.02, 0.018)).toMatchObject({ direction: 'up', tone: 'bad' });
  });

  it('tells no change without a reference', () => {
    expect(deltaOf('revenue', 100, null)).toBeNull();
    expect(deltaOf('revenue', 100, 0)).toBeNull();
  });

  it('places each month of the period, leaving gaps for the missing ones', () => {
    const point = (month: string, revenue: number) => ({
      month,
      firmsWithData: 1,
      activeClients: 1,
      revenue,
      revenuePerClient: null,
      churnRate: null,
    });

    expect(
      valuesByMonth([point('2026-01', 3), point('2025-12', 2)], [11, 12, 1], 'revenue'),
    ).toEqual([null, 2, 3]);
  });
});

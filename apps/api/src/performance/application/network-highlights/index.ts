import type { FiscalPeriod } from '@performance/domain/FiscalPeriod';
import {
  needingAttention,
  standoutsOf,
  type FirmNeedingAttention,
  type Standout,
} from '@performance/domain/Highlights';
import type { NetworkPerformanceRepository } from '@performance/domain/NetworkPerformanceRepository';

export type NetworkHighlights = {
  previousFiscalYear: number | null;
  needsAttention: FirmNeedingAttention[];
  standouts: Standout[];
};

export type GetNetworkHighlights = (period: FiscalPeriod) => Promise<NetworkHighlights>;

export const makeGetNetworkHighlights =
  ({ repository }: { repository: NetworkPerformanceRepository }): GetNetworkHighlights =>
  async (period) => {
    const fiscalYears = await repository.fiscalYears();
    const previousFiscalYear = fiscalYears.includes(period.fiscalYear - 1)
      ? period.fiscalYear - 1
      : null;
    const firms = await repository.firmPeriods(period, previousFiscalYear);
    return {
      previousFiscalYear,
      needsAttention: needingAttention(firms),
      standouts: previousFiscalYear === null ? [] : standoutsOf(firms),
    };
  };

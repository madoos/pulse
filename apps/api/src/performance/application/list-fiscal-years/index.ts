import type { NetworkPerformanceRepository } from '@performance/domain/NetworkPerformanceRepository';

export type ListFiscalYears = () => Promise<number[]>;

export const makeListFiscalYears =
  ({ repository }: { repository: NetworkPerformanceRepository }): ListFiscalYears =>
  () =>
    repository.fiscalYears();

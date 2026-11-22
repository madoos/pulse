import type {
  AdvisoryFirmRepository,
  FirmFilters,
} from '@advisory-firms/domain/AdvisoryFirmRepository';

export type ListFirmFilters = () => Promise<FirmFilters>;

export const makeListFirmFilters =
  ({ repository }: { repository: AdvisoryFirmRepository }): ListFirmFilters =>
  () =>
    repository.filters();

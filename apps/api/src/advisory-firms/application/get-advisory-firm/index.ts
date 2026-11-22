import type {
  AdvisoryFirm,
  AdvisoryFirmRepository,
} from '@advisory-firms/domain/AdvisoryFirmRepository';

export class AdvisoryFirmNotFoundError extends Error {
  constructor(id: number) {
    super(`There is no advisory firm with id ${id}`);
  }
}

export type GetAdvisoryFirm = (id: number) => Promise<AdvisoryFirm>;

export const makeGetAdvisoryFirm =
  ({ repository }: { repository: AdvisoryFirmRepository }): GetAdvisoryFirm =>
  async (id) => {
    const firm = await repository.byId(id);
    if (!firm) throw new AdvisoryFirmNotFoundError(id);
    return firm;
  };

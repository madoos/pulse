import type { AdvisoryFirmRepository } from '@advisory-firms/domain/AdvisoryFirmRepository';
import { describe, expect, it } from 'vitest';
import { AdvisoryFirmNotFoundError, makeGetAdvisoryFirm } from '.';

const firm = {
  id: 7,
  name: 'A',
  taxId: 'B1',
  province: 'Madrid',
  city: 'Madrid',
  employees: 3,
  specialty: 'Fiscal',
  onboardedOn: '2020-01-01',
};

const repositoryWith = (found: typeof firm | null) =>
  ({ byId: async () => found }) as unknown as AdvisoryFirmRepository;

describe('getAdvisoryFirm', () => {
  it('returns the profile of the firm', async () => {
    expect(await makeGetAdvisoryFirm({ repository: repositoryWith(firm) })(7)).toEqual(firm);
  });

  it('fails when the firm does not exist', async () => {
    await expect(
      makeGetAdvisoryFirm({ repository: repositoryWith(null) })(7),
    ).rejects.toBeInstanceOf(AdvisoryFirmNotFoundError);
  });
});

import { describe, expect, it } from 'vitest';
import { ADVISORY_FIRMS_PAGE_SIZE, AdvisoryFirmsQuerySchema } from './advisory-firms';

describe('AdvisoryFirmsQuerySchema', () => {
  it('reads the query string and defaults the page size', () => {
    expect(
      AdvisoryFirmsQuerySchema.parse({ search: ' martínez ', province: '28', specialty: 'fiscal' }),
    ).toEqual({
      search: 'martínez',
      province: 28,
      specialty: 'fiscal',
      limit: ADVISORY_FIRMS_PAGE_SIZE,
    });
  });

  it('rejects a cursor that was not made by the API', () => {
    expect(AdvisoryFirmsQuerySchema.safeParse({ cursor: 'a b' }).success).toBe(false);
  });

  it('limits the size of a page', () => {
    expect(AdvisoryFirmsQuerySchema.safeParse({ limit: '1000' }).success).toBe(false);
  });
});

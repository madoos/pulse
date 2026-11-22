import type {
  AdvisoryFirmRepository,
  AdvisoryFirmSummary,
} from '@advisory-firms/domain/AdvisoryFirmRepository';
import { decodeCursor, encodeCursor } from '@advisory-firms/domain/Cursor';
import { describe, expect, it, vi } from 'vitest';
import { InvalidCursorError, makeListAdvisoryFirms } from '.';

const firm = (id: number, name: string): AdvisoryFirmSummary => ({
  id,
  name,
  province: 'Madrid',
  city: 'Madrid',
  employees: 10,
  specialty: 'Fiscal',
});

const setUp = (rows: AdvisoryFirmSummary[], total = rows.length) => {
  const repository = {
    page: vi.fn(async () => rows),
    count: vi.fn(async () => total),
    filters: vi.fn(),
  } satisfies AdvisoryFirmRepository;
  return { repository, listAdvisoryFirms: makeListAdvisoryFirms({ repository }) };
};

describe('listAdvisoryFirms', () => {
  it('returns a page with the cursor of the next one when there are more firms', async () => {
    const { repository, listAdvisoryFirms } = setUp([firm(1, 'A'), firm(2, 'B'), firm(3, 'C')], 7);

    const page = await listAdvisoryFirms({ search: 'a', province: 28, limit: 2 });

    expect(repository.page).toHaveBeenCalledWith({ search: 'a', provinceId: 28 }, null, 3);
    expect(page.items.map((f) => f.id)).toEqual([1, 2]);
    expect(page.total).toBe(7);
    expect(decodeCursor(page.nextCursor!)).toEqual({ name: 'B', id: 2 });
  });

  it('has no next cursor on the last page', async () => {
    const { listAdvisoryFirms } = setUp([firm(1, 'A')]);

    expect((await listAdvisoryFirms({ limit: 2 })).nextCursor).toBeNull();
  });

  it('starts after the firm of the cursor', async () => {
    const { repository, listAdvisoryFirms } = setUp([]);

    await listAdvisoryFirms({ cursor: encodeCursor({ name: 'B', id: 2 }), limit: 2 });

    expect(repository.page).toHaveBeenCalledWith(expect.anything(), { name: 'B', id: 2 }, 3);
  });

  it('ignores an empty search', async () => {
    const { repository, listAdvisoryFirms } = setUp([]);

    await listAdvisoryFirms({ search: '', limit: 2 });

    expect(repository.count).toHaveBeenCalledWith({});
  });

  it('rejects a cursor it did not make', async () => {
    const { listAdvisoryFirms } = setUp([]);

    await expect(listAdvisoryFirms({ cursor: 'nope', limit: 2 })).rejects.toBeInstanceOf(
      InvalidCursorError,
    );
  });
});

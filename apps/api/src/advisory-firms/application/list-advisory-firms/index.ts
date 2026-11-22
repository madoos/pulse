import type {
  AdvisoryFirmRepository,
  AdvisoryFirmSummary,
  FirmCriteria,
} from '@advisory-firms/domain/AdvisoryFirmRepository';
import { decodeCursor, encodeCursor } from '@advisory-firms/domain/Cursor';

export type ListAdvisoryFirmsInput = {
  search?: string;
  province?: number;
  specialty?: string;
  cursor?: string;
  limit: number;
};

export type AdvisoryFirmsPage = {
  items: AdvisoryFirmSummary[];
  total: number;
  nextCursor: string | null;
};

export class InvalidCursorError extends Error {
  constructor() {
    super('The cursor is not valid');
  }
}

export type ListAdvisoryFirms = (input: ListAdvisoryFirmsInput) => Promise<AdvisoryFirmsPage>;

export const makeListAdvisoryFirms =
  ({ repository }: { repository: AdvisoryFirmRepository }): ListAdvisoryFirms =>
  async ({ search, province, specialty, cursor, limit }) => {
    const after = cursor === undefined ? null : decodeCursor(cursor);
    if (cursor !== undefined && !after) throw new InvalidCursorError();
    const criteria: FirmCriteria = {
      search: search || undefined,
      provinceId: province,
      specialtyCode: specialty,
    };
    // One more than the page tells whether there is a next one without counting again.
    const [rows, total] = await Promise.all([
      repository.page(criteria, after, limit + 1),
      repository.count(criteria),
    ]);
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items,
      total,
      nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
    };
  };

import type { FirmKey } from './AdvisoryFirmRepository';

/**
 * A cursor is the key of the last firm of a page, opaque to the client. Paging by key
 * costs the same on any page and does not skip or repeat firms when the data changes.
 */
export const encodeCursor = ({ name, id }: FirmKey) =>
  Buffer.from(JSON.stringify([name, id])).toString('base64url');

/** The key in a cursor, or null if it was not made by `encodeCursor`. */
export const decodeCursor = (cursor: string): FirmKey | null => {
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!Array.isArray(value) || value.length !== 2) return null;
    const [name, id] = value as unknown[];
    return typeof name === 'string' && Number.isInteger(id) ? { name, id: id as number } : null;
  } catch {
    return null;
  }
};

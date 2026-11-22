import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor } from './Cursor';

describe('cursor', () => {
  it('carries the key of a firm, accents included, in a URL-safe string', () => {
    const cursor = encodeCursor({ name: 'Gestoría Martínez & Asociados', id: 1 });

    expect(cursor).toMatch(/^[\w-]+$/);
    expect(decodeCursor(cursor)).toEqual({ name: 'Gestoría Martínez & Asociados', id: 1 });
  });

  it('rejects a cursor it did not make', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull();
    expect(decodeCursor(Buffer.from('{"id":1}').toString('base64url'))).toBeNull();
    expect(decodeCursor(Buffer.from('["a",1.5]').toString('base64url'))).toBeNull();
  });
});

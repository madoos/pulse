import { documentOf } from '@support-assistant/testing/fakes';
import { describe, expect, it } from 'vitest';
import { SIMILARITY_THRESHOLD, relevantOf, sourcesOf, withoutUnknownCitations } from './Retrieval';
import type { FoundDocument } from './SupportDocument';

const found = (id: string, similarity = 0.85): FoundDocument => ({
  document: documentOf(id),
  similarity,
});
const retrieved = new Map([found('SUP-0001'), found('SUP-0002')].map((f) => [f.document.id, f]));

describe('relevantOf', () => {
  it('keeps only the documents at or above the threshold', () => {
    const below = found('SUP-0003', SIMILARITY_THRESHOLD - 0.01);
    const at = found('SUP-0004', SIMILARITY_THRESHOLD);

    expect(relevantOf([found('SUP-0001'), below, at])).toEqual([found('SUP-0001'), at]);
  });
});

describe('sourcesOf', () => {
  it('returns the cited documents a search returned, once, in the order they are cited', () => {
    const text = 'Cobros tardíos [SUP-0002] y de nuevo [SUP-0002], además [SUP-0001].';

    expect(sourcesOf(text, retrieved).map((d) => d.id)).toEqual(['SUP-0002', 'SUP-0001']);
  });

  it('drops an id no search returned, such as a made-up one or one of another firm', () => {
    expect(sourcesOf('Según [SUP-0999] y [SUP-0001].', retrieved).map((d) => d.id)).toEqual([
      'SUP-0001',
    ]);
  });

  it('has no sources when the answer cites nothing', () => {
    expect(sourcesOf('No hay información suficiente.', retrieved)).toEqual([]);
  });
});

describe('withoutUnknownCitations', () => {
  it('removes the citations of documents no search returned and keeps the rest', () => {
    expect(withoutUnknownCitations('Cobros [SUP-0001] e IVA [SUP-0999].', retrieved)).toBe(
      'Cobros [SUP-0001] e IVA.',
    );
  });

  it('reads an id written with another dash as the same id', () => {
    const text = withoutUnknownCitations('Cobros [SUP‑0001] y [SUP–0002].', retrieved);

    expect(text).toBe('Cobros [SUP-0001] y [SUP-0002].');
    expect(sourcesOf(text, retrieved).map((d) => d.id)).toEqual(['SUP-0001', 'SUP-0002']);
  });

  it('never shows an unknown id, even outside brackets', () => {
    expect(withoutUnknownCitations('Como dice SUP-0999.', retrieved)).toBe(
      'Como dice un documento no verificado.',
    );
  });
});

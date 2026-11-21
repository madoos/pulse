import { describe, expect, it } from 'vitest';
import {
  closeFirmsDrawer,
  firmsDrawerHref,
  openFirmsDrawer,
  readFirmsDrawer,
} from './firmsDrawer.url';

describe('firmsDrawer', () => {
  it('reads the drawer, its search and its filters from the URL', () => {
    const params = new URLSearchParams('year=2025&firms=open&q=gestor&specialty=fiscal');

    expect(readFirmsDrawer(params)).toEqual({
      isOpen: true,
      search: 'gestor',
      filters: { specialty: 'fiscal', community: null, size: null },
    });
    expect(readFirmsDrawer(new URLSearchParams('year=2025')).isOpen).toBe(false);
  });

  it('opens over the params of the page and drops empty values', () => {
    const params = new URLSearchParams('year=2025&q=old');

    expect(openFirmsDrawer(params, { search: '', community: 'madrid' }).toString()).toBe(
      'year=2025&firms=open&community=madrid',
    );
  });

  it('closes leaving only the params of the page', () => {
    const params = new URLSearchParams('year=2025&firms=open&q=gestor&size=small');

    expect(closeFirmsDrawer(params).toString()).toBe('year=2025');
  });

  it('links to the drawer over the current page', () => {
    expect(firmsDrawerHref('/', new URLSearchParams('year=2025'))).toBe('/?year=2025&firms=open');
  });
});

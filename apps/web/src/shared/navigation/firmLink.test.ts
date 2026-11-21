import { describe, expect, it } from 'vitest';
import { backHref, firmPath, fromState } from './firmLink';

describe('firmLink', () => {
  it('goes back to the page the detail was opened from', () => {
    const state = fromState({ pathname: '/', search: '?firms=open&q=gestor' });

    expect(backHref(state)).toBe('/?firms=open&q=gestor');
  });

  it('goes back to the network overview after opening the URL directly', () => {
    expect(backHref(null)).toBe('/');
    expect(backHref({ from: 'https://example.com' })).toBe('/');
  });

  it('builds the path of a detail page', () => {
    expect(firmPath(7)).toBe('/advisory-firms/7');
  });
});

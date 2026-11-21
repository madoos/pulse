import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Navigation } from './Navigation';

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Navigation />
    </MemoryRouter>,
  );

describe('Navigation', () => {
  it('marks the network overview on the home page', () => {
    renderAt('/');

    expect(screen.getByRole('link', { name: 'Vista de red' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Asesorías' })).not.toHaveAttribute('aria-current');
  });

  it('opens the advisory firms over the current page, keeping its filters', () => {
    renderAt('/?year=2025');

    expect(screen.getByRole('link', { name: 'Asesorías' })).toHaveAttribute(
      'href',
      '/?year=2025&firms=open',
    );
  });

  it('marks the advisory firms on a detail page', () => {
    renderAt('/advisory-firms/7');

    expect(screen.getByRole('link', { name: 'Asesorías' })).toHaveAttribute('aria-current', 'page');
  });
});

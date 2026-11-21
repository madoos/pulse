import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Navigation } from './Navigation';

describe('Navigation', () => {
  it('links to every view and marks the current one', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: 'Principal' });
    const link = screen.getByRole('link', { name: 'Vista de red' });
    expect(nav).toContainElement(link);
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});

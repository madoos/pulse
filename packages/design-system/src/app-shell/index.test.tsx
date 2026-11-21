import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { AppShell, SideNavLink } from '.';

const renderShell = () =>
  render(
    <AppShell
      brand="Pulse"
      navigation={
        <>
          <SideNavLink href="/" isCurrent>
            Vista de red
          </SideNavLink>
          <SideNavLink href="/?firms">Asesorías</SideNavLink>
        </>
      }
      user={<span>ana@example.com</span>}
    >
      <h1>Vista de red</h1>
    </AppShell>,
  );

describe('AppShell', () => {
  it('frames the content with the navigation and the user', () => {
    renderShell();

    expect(screen.getByRole('main')).toHaveTextContent('Vista de red');
    expect(screen.getByRole('complementary')).toHaveTextContent('ana@example.com');
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
  });

  it('marks the link of the current page', () => {
    renderShell();

    expect(screen.getByRole('link', { name: 'Vista de red' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Asesorías' })).not.toHaveAttribute('aria-current');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderShell();

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

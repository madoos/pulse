import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LinkRouter } from '.';
import { SideNavLink } from '../app-shell';

describe('LinkRouter', () => {
  it('navigates with the router of the application', async () => {
    const navigate = vi.fn();
    render(
      <LinkRouter navigate={navigate}>
        <SideNavLink href="/advisory-firms/7">Asesoría</SideNavLink>
      </LinkRouter>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Asesoría' }));

    expect(navigate).toHaveBeenCalledWith('/advisory-firms/7', undefined);
  });
});

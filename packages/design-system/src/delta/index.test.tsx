import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { Delta } from '.';

describe('Delta', () => {
  it('shows the change with an arrow hidden from screen readers', () => {
    render(
      <Delta direction="down" tone="good">
        −0,3 p.p.
      </Delta>,
    );

    expect(screen.getByText('−0,3 p.p.')).toBeInTheDocument();
    expect(screen.getByText('▼')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Delta direction="up" tone="bad">
        +0,3 p.p.
      </Delta>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

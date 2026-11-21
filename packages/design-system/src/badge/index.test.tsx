import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { Badge } from '.';

describe('Badge', () => {
  it('shows its text', () => {
    render(<Badge tone="danger">Muchas bajas</Badge>);

    expect(screen.getByText('Muchas bajas')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Badge tone="success">Crece</Badge>);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

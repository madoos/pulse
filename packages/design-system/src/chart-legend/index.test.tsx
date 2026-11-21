import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { ChartLegend } from '.';

const items = [
  { id: '2025', label: '2025-26' },
  { id: '2024', label: '2024-25', color: 2 as const, muted: true },
];

describe('ChartLegend', () => {
  it('lists the series', () => {
    render(<ChartLegend items={items} />);

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '2025-26',
      '2024-25',
    ]);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ChartLegend items={items} />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { StatCard } from '.';

describe('StatCard', () => {
  it('shows a labelled value with its change and footnote', () => {
    render(
      <StatCard
        label="Facturación"
        value="16.608.337 €"
        change="+21,2 %"
        footnote="Suma del periodo"
      />,
    );

    expect(screen.getByRole('article', { name: 'Facturación' })).toHaveTextContent(
      'Facturación16.608.337 €+21,2 %Suma del periodo',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<StatCard label="Clientes activos" value="8.148" />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

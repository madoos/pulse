import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { LineChart } from '.';

const props = {
  label: 'Facturación mensual',
  categories: ['abr', 'may', 'jun'],
  formatValue: (value: number) => `${value} €`,
};

describe('LineChart', () => {
  it('is an image described by its label, with one line per series', () => {
    const { container } = render(
      <LineChart
        {...props}
        series={[
          { id: '2025', label: '2025-26', values: [1, 2, 3] },
          { id: '2024', label: '2024-25', values: [1, 1, 2], muted: true, color: 2 },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'Facturación mensual' })).toBeInTheDocument();
    expect(container.querySelectorAll('path[class*="line-chart__line"]')).toHaveLength(2);
    expect(screen.getByRole('list', { name: 'Leyenda' })).toHaveTextContent('2025-262024-25');
  });

  it('has no legend with a single series', () => {
    render(<LineChart {...props} series={[{ id: 'a', label: 'A', values: [1, 2, 3] }]} />);

    expect(screen.queryByRole('list', { name: 'Leyenda' })).not.toBeInTheDocument();
  });

  it('shows the values of a month on hover', () => {
    render(
      <LineChart
        {...props}
        series={[{ id: 'a', label: 'A', values: [10, 20, null] }]}
        describeCategory={() => '50 de 50 asesorías con datos'}
      />,
    );

    fireEvent.pointerMove(screen.getByTestId('line-chart-overlay'), { clientX: 56, clientY: 50 });

    expect(screen.getByRole('tooltip')).toHaveTextContent('abr10 €50 de 50 asesorías con datos');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <LineChart {...props} series={[{ id: 'a', label: 'A', values: [1, null, 3] }]} />,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

describe('LineChart compact', () => {
  it('labels only a few months and leaves the legend to the view', () => {
    const months = [
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
      'ene',
      'feb',
      'mar',
    ];
    const { container } = render(
      <LineChart
        {...props}
        compact
        categories={months}
        series={[
          { id: '2025', label: '2025-26', values: months.map((_, i) => i) },
          { id: '2024', label: '2024-25', values: months.map((_, i) => i / 2), muted: true },
        ]}
      />,
    );

    const labels = [...container.querySelectorAll('.visx-axis-bottom text')].map(
      (t) => t.textContent,
    );
    expect(labels).toEqual(['abr', 'jul', 'oct', 'ene', 'mar']);
    expect(screen.queryByRole('list', { name: 'Leyenda' })).not.toBeInTheDocument();
  });
});

describe('LineChart series', () => {
  it('names each line after its series', () => {
    const { container } = render(
      <LineChart
        {...props}
        series={[
          { id: '2025', label: '2025-26', values: [1, 2] },
          { id: '2024', label: '2024-25', values: [1, 1], muted: true },
        ]}
      />,
    );

    const names = [...container.querySelectorAll('[data-series]')].map((line) =>
      line.getAttribute('data-series'),
    );
    expect(names.toSorted()).toEqual(['2024-25', '2025-26']);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NetworkFilters, describeFilters } from './NetworkFilters';

const filters = { fiscalYear: 2025, compareWith: null, fromMonth: 6, toMonth: 3, groupBy: null };

describe('NetworkFilters', () => {
  it('does not offer the selected year to compare with', async () => {
    render(
      <NetworkFilters fiscalYears={[2025, 2024, 2023]} filters={filters} onChange={() => {}} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Comparar con/ }));

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Ninguno',
      '2024-25',
      '2023-24',
    ]);
  });

  it('only offers months after the first one as the last one', async () => {
    render(<NetworkFilters fiscalYears={[2025]} filters={filters} onChange={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: /Hasta/ }));

    expect(screen.queryByRole('option', { name: 'abril' })).toBeNull();
    expect(screen.getByRole('option', { name: 'junio' })).toBeInTheDocument();
  });

  it('reports the change of a filter', async () => {
    const onChange = vi.fn();
    render(<NetworkFilters fiscalYears={[2025]} filters={filters} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /Agrupar por/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Especialidad' }));

    expect(onChange).toHaveBeenCalledWith({ groupBy: 'specialty' });
  });
});

describe('describeFilters', () => {
  it('says in words what is shown', () => {
    expect(describeFilters({ ...filters, fromMonth: 4 })).toBe(
      'Estás viendo todo el año 2025-26, sin comparar con otro año.',
    );
    expect(
      describeFilters({ ...filters, fromMonth: 1, compareWith: 2023, groupBy: 'specialty' }),
    ).toBe(
      'Estás viendo de enero a marzo 2025-26 frente a los mismos meses de 2023-24, por especialidad.',
    );
  });
});

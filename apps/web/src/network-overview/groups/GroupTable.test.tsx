import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { specialtyGroups } from '@network-overview/networkOverview.fixtures';
import { GroupTable, sortGroups, summarizeGroups } from './GroupTable';

describe('GroupTable', () => {
  it('puts Laboral before Fiscal by revenue per advisory firm', () => {
    const sorted = sortGroups(specialtyGroups, {
      column: 'revenuePerFirm',
      direction: 'descending',
    });

    expect(sorted.map((g) => g.name)).toEqual(['Laboral', 'Fiscal']);
  });

  it('sums the groups up in one line while closed', () => {
    expect(summarizeGroups('specialty', specialtyGroups)).toBe(
      '2 especialidades · más facturación por asesoría: Laboral (410.000\u00a0€) · menos: Fiscal (327.500\u00a0€)',
    );
  });

  it('starts closed and opens to show the table', async () => {
    render(
      <GroupTable
        groupBy="specialty"
        groups={specialtyGroups}
        comparedYear={null}
        sort={{ column: 'name', direction: 'ascending' }}
        onSortChange={() => {}}
      />,
    );

    expect(screen.queryByRole('grid')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Por especialidad' }));

    expect(screen.getByRole('grid', { name: 'Grupos por especialidad' })).toBeInTheDocument();
  });

  it('shows the revenue change only when comparing', async () => {
    const props = {
      groupBy: 'specialty' as const,
      groups: specialtyGroups,
      sort: { column: 'name', direction: 'ascending' as const },
      onSortChange: () => {},
    };
    const { rerender } = render(<GroupTable {...props} comparedYear={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Por especialidad' }));

    expect(screen.queryByRole('columnheader', { name: /vs 2024-25/ })).toBeNull();

    rerender(<GroupTable {...props} comparedYear={2024} />);

    expect(
      screen.getByRole('columnheader', { name: /Facturación vs 2024-25/ }),
    ).toBeInTheDocument();
  });

  it('sorts by any column', async () => {
    const onSortChange = vi.fn();
    render(
      <GroupTable
        groupBy="autonomous-community"
        groups={specialtyGroups}
        comparedYear={null}
        sort={{ column: 'name', direction: 'ascending' }}
        onSortChange={onSortChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Por comunidad autónoma' }));
    const table = screen.getByRole('grid', { name: 'Grupos por comunidad autónoma' });
    await userEvent.click(within(table).getByRole('columnheader', { name: /Bajas al mes/ }));

    expect(onSortChange).toHaveBeenCalledWith({ column: 'churnRate', direction: 'ascending' });
  });
});

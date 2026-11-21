import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { specialtyGroups } from '@network-overview/networkOverview.fixtures';
import { GroupTable, sortGroups } from './GroupTable';

describe('GroupTable', () => {
  it('puts Laboral before Fiscal by revenue per advisory firm', () => {
    const sorted = sortGroups(specialtyGroups, {
      column: 'revenuePerFirm',
      direction: 'descending',
    });

    expect(sorted.map((g) => g.name)).toEqual(['Laboral', 'Fiscal']);
  });

  it('shows the revenue change only when comparing', () => {
    const props = {
      groupBy: 'specialty' as const,
      groups: specialtyGroups,
      sort: { column: 'name', direction: 'ascending' as const },
      onSortChange: () => {},
    };
    const { rerender } = render(<GroupTable {...props} comparedYear={null} />);

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

    const table = screen.getByRole('grid', { name: 'Grupos por comunidad autónoma' });
    await userEvent.click(within(table).getByRole('columnheader', { name: /Bajas al mes/ }));

    expect(onSortChange).toHaveBeenCalledWith({ column: 'churnRate', direction: 'ascending' });
  });
});

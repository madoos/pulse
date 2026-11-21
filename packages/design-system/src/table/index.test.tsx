import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { Table, type TableColumn } from '.';

const columns: TableColumn[] = [
  { id: 'name', label: 'Especialidad', isRowHeader: true, allowsSorting: true },
  { id: 'firms', label: 'Asesorías', allowsSorting: true, align: 'end' },
];

const rows = [
  { id: 'fiscal', cells: { name: 'Fiscal', firms: 24 } },
  { id: 'laboral', cells: { name: 'Laboral', firms: 10 } },
];

describe('Table', () => {
  it('shows one row per item with its cells', () => {
    render(<Table label="Especialidades" columns={columns} rows={rows} />);

    const table = screen.getByRole('grid', { name: 'Especialidades' });
    const [, first] = within(table).getAllByRole('row');
    expect(first).toHaveTextContent('Fiscal24');
  });

  it('asks to sort when a sortable column is pressed', async () => {
    const onSortChange = vi.fn();
    render(
      <Table
        label="Especialidades"
        columns={columns}
        rows={rows}
        sort={{ column: 'name', direction: 'ascending' }}
        onSortChange={onSortChange}
      />,
    );

    await userEvent.click(screen.getByRole('columnheader', { name: 'Asesorías' }));

    expect(onSortChange).toHaveBeenCalledWith({ column: 'firms', direction: 'ascending' });
    expect(screen.getByRole('columnheader', { name: /Especialidad/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Table label="Especialidades" columns={columns} rows={rows} />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

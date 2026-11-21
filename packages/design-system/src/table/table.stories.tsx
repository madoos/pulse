import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Table, type TableProps, type TableSort } from '.';

const groups = [
  { id: 'laboral', name: 'Laboral', firms: 10, revenuePerFirm: 410125 },
  { id: 'fiscal', name: 'Fiscal', firms: 24, revenuePerFirm: 327655 },
  { id: 'contable', name: 'Contable', firms: 16, revenuePerFirm: 290210 },
];

const SortableTable = (props: TableProps) => {
  const [sort, setSort] = useState<TableSort>({
    column: 'revenuePerFirm',
    direction: 'descending',
  });
  const sorted = [...groups].sort((a, b) => {
    const key = sort.column as keyof (typeof groups)[number];
    const order = a[key] < b[key] ? -1 : 1;
    return sort.direction === 'ascending' ? order : -order;
  });
  return (
    <Table
      {...props}
      sort={sort}
      onSortChange={setSort}
      rows={sorted.map((g) => ({
        id: g.id,
        cells: {
          name: g.name,
          firms: g.firms,
          revenuePerFirm: `${g.revenuePerFirm.toLocaleString('es-ES')} €`,
        },
      }))}
    />
  );
};

const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: { layout: 'padded' },
  args: {
    label: 'Especialidades',
    columns: [
      { id: 'name', label: 'Especialidad', isRowHeader: true, allowsSorting: true },
      { id: 'firms', label: 'Asesorías', allowsSorting: true, align: 'end' },
      {
        id: 'revenuePerFirm',
        label: 'Facturación por asesoría',
        allowsSorting: true,
        align: 'end',
      },
    ],
    rows: [],
  },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sortable: Story = { render: (args) => <SortableTable {...args} /> };

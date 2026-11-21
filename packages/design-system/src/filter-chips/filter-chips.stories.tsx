import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FilterChips, type FilterChipsProps } from '.';

const ControlledChips = (props: FilterChipsProps) => {
  const [selected, setSelected] = useState(props.selectedKey);
  return <FilterChips {...props} selectedKey={selected} onSelectionChange={setSelected} />;
};

const meta = {
  title: 'Components/FilterChips',
  component: FilterChips,
  render: (args) => <ControlledChips {...args} />,
  args: {
    label: 'Filtrar alertas',
    selectedKey: 'all',
    onSelectionChange: () => {},
    chips: [
      { id: 'all', label: 'Todas', count: 9 },
      { id: 'losing-clients', label: 'Pierde clientes', count: 1 },
      { id: 'high-churn', label: 'Muchas bajas', count: 2 },
      { id: 'missing-data', label: 'Sin datos', count: 0 },
    ],
  },
} satisfies Meta<typeof FilterChips>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

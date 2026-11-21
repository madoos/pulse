import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Select, type SelectProps } from '.';

const ControlledSelect = (props: SelectProps) => {
  const [selected, setSelected] = useState(props.selectedKey);
  return <Select {...props} selectedKey={selected} onSelectionChange={setSelected} />;
};

const meta = {
  title: 'Components/Select',
  component: Select,
  render: (args) => <ControlledSelect {...args} />,
  args: {
    label: 'Año fiscal',
    selectedKey: '2025',
    onSelectionChange: () => {},
    options: [
      { id: '2025', label: '2025-26' },
      { id: '2024', label: '2024-25' },
      { id: '2023', label: '2023-24' },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { isDisabled: true } };

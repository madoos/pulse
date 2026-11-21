import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartLegend } from '.';

const meta = {
  title: 'Charts/ChartLegend',
  component: ChartLegend,
  args: {
    items: [
      { id: '2025', label: '2025-26' },
      { id: '2024', label: '2024-25', color: 2, muted: true },
    ],
  },
} satisfies Meta<typeof ChartLegend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ComparedYears: Story = {};

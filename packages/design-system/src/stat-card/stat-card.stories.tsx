import type { Meta, StoryObj } from '@storybook/react-vite';
import { Delta } from '../delta';
import { Sparkline } from '../sparkline';
import { StatCard } from '.';

const meta = {
  title: 'Components/StatCard',
  component: StatCard,
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
  args: { label: 'Facturación', value: '16.608.337 €' },
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Simple: Story = {};

export const Complete: Story = {
  args: {
    change: (
      <Delta direction="up" tone="good">
        +21,2 % vs 2024-25
      </Delta>
    ),
    chart: (
      <Sparkline
        label="Facturación mensual de abril a marzo"
        values={[13, 13, 16, 11, 10, 14, 13, 13, 13, 16, 16, 16]}
      />
    ),
    footnote: 'Suma de la facturación de todas las asesorías en el periodo.',
  },
};

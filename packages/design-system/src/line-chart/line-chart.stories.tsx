import type { Meta, StoryObj } from '@storybook/react-vite';
import { LineChart } from '.';

const months = ['abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic', 'ene', 'feb', 'mar'];
const euros = (value: number) => `${Math.round(value).toLocaleString('es-ES')} €`;
const millions = (value: number) => `${(value / 1e6).toLocaleString('es-ES')} M`;

const meta = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: { layout: 'padded' },
  args: {
    label: 'Facturación mensual de la red',
    categories: months,
    formatValue: euros,
    formatTick: millions,
    series: [
      {
        id: '2025',
        label: '2025-26',
        values: [
          1337243, 1308812, 1630280, 1092800, 1070739, 1391540, 1322417, 1314372, 1302001, 1592683,
          1621577, 1623873,
        ],
      },
    ],
  },
} satisfies Meta<typeof LineChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OneSeries: Story = {
  args: { describeCategory: () => '50 de 50 asesorías con datos' },
};

export const ComparedYear: Story = {
  args: {
    series: [
      {
        id: '2025',
        label: '2025-26',
        values: [
          1337243, 1308812, 1630280, 1092800, 1070739, 1391540, 1322417, 1314372, 1302001, 1592683,
          1621577, 1623873,
        ],
      },
      {
        id: '2024',
        label: '2024-25',
        color: 2,
        muted: true,
        values: [
          1100000, 1090000, 1380000, 950000, 900000, 1150000, 1100000, 1080000, 1090000, 1320000,
          1350000, 1360000,
        ],
      },
    ],
  },
};

export const Compact: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 260 }}>
        <Story />
      </div>
    ),
  ],
  args: { ...ComparedYear.args, compact: true },
};

export const WithGap: Story = {
  args: {
    label: 'Clientes activos de una asesoría con un mes sin datos',
    formatValue: (value) => value.toLocaleString('es-ES'),
    formatTick: undefined,
    series: [
      {
        id: 'clients',
        label: 'Clientes',
        values: [221, 231, 236, null, 245, 250, 251, 258, 262, 266, 270, 271],
      },
    ],
  },
};

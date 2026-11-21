import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from '.';

const meta = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  decorators: [
    (Story) => (
      <div style={{ width: 200, height: 40 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Clientes activos de abril a marzo, de 6.868 a 8.148',
    values: [6868, 6982, 7088, 7248, 7412, 7530, 7605, 7732, 7874, 7982, 8090, 8148],
  },
} satisfies Meta<typeof Sparkline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Growing: Story = {};

export const WithGap: Story = {
  args: { label: 'Una serie con un mes sin datos', values: [3, 4, null, 5, 4, 6] },
};

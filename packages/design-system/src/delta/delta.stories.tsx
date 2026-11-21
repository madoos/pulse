import type { Meta, StoryObj } from '@storybook/react-vite';
import { Delta } from '.';

const meta = {
  title: 'Components/Delta',
  component: Delta,
  args: { direction: 'up', tone: 'good', children: '+21,2 % vs 2024-25' },
  argTypes: {
    direction: { control: 'inline-radio', options: ['up', 'down', 'flat'] },
    tone: { control: 'inline-radio', options: ['good', 'bad', 'neutral'] },
  },
} satisfies Meta<typeof Delta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GoodUp: Story = {};

export const GoodDown: Story = {
  args: { direction: 'down', tone: 'good', children: '−0,3 p.p. vs 2024-25' },
};

export const BadDown: Story = {
  args: { direction: 'down', tone: 'bad', children: '−2,1 % vs 2024-25' },
};

export const Flat: Story = { args: { direction: 'flat', tone: 'neutral', children: '0,0 %' } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '.';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Muchas bajas' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'danger', 'success'] } },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Danger: Story = { args: { tone: 'danger' } };

export const Success: Story = { args: { tone: 'success', children: 'Crece' } };

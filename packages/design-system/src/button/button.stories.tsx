import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '.';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Ver asesorías' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = { args: { variant: 'secondary' } };

export const Disabled: Story = { args: { isDisabled: true } };

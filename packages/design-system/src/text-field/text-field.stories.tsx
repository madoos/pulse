import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from '.';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: { label: 'Email', type: 'email' },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Password: Story = { args: { label: 'Contraseña', type: 'password' } };

export const Invalid: Story = {
  args: { isInvalid: true, errorMessage: 'Escribe un email válido', defaultValue: 'ana' },
};

export const Disabled: Story = { args: { isDisabled: true, defaultValue: 'ana@example.com' } };

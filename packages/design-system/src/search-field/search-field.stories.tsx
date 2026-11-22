import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchField } from '.';

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  parameters: { layout: 'padded' },
  args: { label: 'Buscar asesoría', placeholder: 'Nombre, ciudad o CIF' },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: 'Gestoría' } };

export const HiddenLabel: Story = { args: { hideLabel: true } };

export const WithSubmitButton: Story = {
  args: { hideLabel: true, placeholder: 'Nombre de la asesoría', submitLabel: 'Buscar' },
};

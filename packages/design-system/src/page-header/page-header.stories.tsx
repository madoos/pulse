import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from '.';
import { SearchField } from '../search-field';

const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  parameters: { layout: 'padded' },
  args: { title: 'Vista de red', description: 'Cómo va la red de asesorías' },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: <SearchField label="Buscar asesoría" hideLabel placeholder="Buscar asesoría" />,
  },
};

export const WithBack: Story = {
  args: { title: 'Gestoria Manchega Integral', back: <a href="#">← Volver</a> },
};

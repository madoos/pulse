import type { Meta, StoryObj } from '@storybook/react-vite';
import { Panel } from '.';

const meta = {
  title: 'Components/Panel',
  component: Panel,
  parameters: { layout: 'padded' },
  args: {
    title: 'Asesorías que destacan',
    description: 'Las 5 que más crecen en clientes activos',
    children: <p>Contenido del panel</p>,
  },
} satisfies Meta<typeof Panel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = {
  args: { title: 'Necesitan atención', tone: 'danger', aside: '3 de 50 asesorías' },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Message } from '.';

const meta = {
  title: 'Components/Message',
  component: Message,
  args: { title: 'Ninguna asesoría necesita atención' },
} satisfies Meta<typeof Message>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Failure: Story = {
  args: {
    tone: 'error',
    title: 'No se han podido cargar los datos',
    children: 'Comprueba la conexión y vuelve a intentarlo.',
    action: <Button variant="secondary">Reintentar</Button>,
  },
};

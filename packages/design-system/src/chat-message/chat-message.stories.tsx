import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatMessage } from '.';

const meta = {
  title: 'Components/ChatMessage',
  component: ChatMessage,
  args: { author: 'assistant', children: 'Retrasos recurrentes en el pago de cuotas [SUP-0001].' },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '26rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Question: Story = {
  args: { author: 'user', children: '¿Qué incidencias recurrentes tiene?' },
};

export const AnswerWithSources: Story = {
  args: {
    sources: [
      {
        id: 'SUP-0001',
        description: 'Ticket · 3 nov 2025',
        title: 'Retraso en el pago de la cuota',
      },
      { id: 'SUP-0004', description: 'Email · 12 ene 2026', title: 'Segundo aviso de cobro' },
    ],
  },
};

export const Pending: Story = { args: { isPending: true, children: undefined } };

export const NotEnoughInformation: Story = {
  args: {
    tone: 'notice',
    children: 'No hay información suficiente en los documentos de esta asesoría.',
  },
};

export const Failure: Story = {
  args: {
    tone: 'error',
    children: 'Se ha agotado la cuota gratuita del modelo. Inténtalo más tarde.',
  },
};

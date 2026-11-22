import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ChatPanel } from '.';
import { ChatMessage } from '../chat-message';

const SUGGESTIONS = [
  '¿Qué incidencias recurrentes tiene?',
  '¿Qué sabemos sobre su forma de trabajar con IVA o renta?',
  'Resume los problemas más frecuentes de los últimos meses.',
  '¿Qué documentación respalda esa respuesta?',
];

const meta = {
  title: 'Components/ChatPanel',
  component: ChatPanel,
  args: {
    title: 'Intelligence Engine',
    badge: 'Beta',
    description: 'Responde con los chats, notas, tickets y emails de esta asesoría.',
    placeholder: 'Pregunta todo sobre la asesoría',
    value: '',
    onChange: () => {},
    onSubmit: () => {},
    onClose: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <ChatPanel {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof ChatPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    suggestions: { label: 'Puedes preguntar, por ejemplo', items: SUGGESTIONS, onSelect: () => {} },
  },
};

export const Conversation: Story = {
  args: {
    children: (
      <>
        <ChatMessage author="user">¿Qué incidencias recurrentes tiene?</ChatMessage>
        <ChatMessage
          author="assistant"
          sources={[
            { id: 'SUP-0001', description: 'Ticket · 3 nov 2025', title: 'Retraso en el pago' },
            { id: 'SUP-0004', description: 'Email · 12 ene 2026', title: 'Segundo aviso' },
          ]}
        >
          Retrasos recurrentes en el pago de cuotas [SUP-0001] [SUP-0004].
        </ChatMessage>
        <ChatMessage author="user">¿Y con el IVA?</ChatMessage>
        <ChatMessage author="assistant" isPending />
      </>
    ),
    isBusy: true,
  },
};

export const Unavailable: Story = {
  args: {
    isDisabled: true,
    children: (
      <ChatMessage author="assistant" tone="error">
        El asistente no está disponible en este momento.
      </ChatMessage>
    ),
  },
};

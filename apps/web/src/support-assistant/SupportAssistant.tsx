import type { SupportSource } from '@pulse/contracts';
import { AssistantLauncher, ChatMessage, ChatPanel, type ChatSource } from '@pulse/design-system';
import { formatDate } from '@shared/format';
import { useId, useState } from 'react';
import type { ConversationStatus, Exchange, ExchangeStatus } from './supportAssistant.slice';

const NAME = 'Intelligence Engine';
const BADGE = 'Beta';

/** The questions the brief expects the assistant to answer. */
export const EXAMPLE_QUESTIONS = [
  '¿Qué incidencias recurrentes tiene?',
  '¿Qué sabemos sobre su forma de trabajar con IVA o renta?',
  'Resume los problemas más frecuentes de los últimos meses.',
  '¿Qué documentación respalda esa respuesta?',
];

const DOCUMENT_TYPES: Record<string, string> = {
  chat: 'Chat',
  nota_interna: 'Nota interna',
  ticket: 'Ticket',
  email: 'Email',
};

const NOTICES: Record<Exclude<ExchangeStatus, 'pending' | 'answered'>, string> = {
  'not-enough-information':
    'No hay información suficiente en los documentos de soporte de esta asesoría para responder a esa pregunta.',
  'quota-exceeded':
    'Se ha agotado la cuota gratuita del modelo de IA, así que ahora no puedo responder. Vuelve a intentarlo más tarde.',
  unavailable: 'El asistente no está disponible: el modelo de IA no está configurado.',
  failed: 'No he podido responder a esta pregunta. Vuelve a intentarlo.',
};

const CONVERSATION_NOTICES: Partial<Record<ConversationStatus, string>> = {
  unavailable: NOTICES.unavailable,
  failed: 'No se ha podido abrir la conversación. Cierra la ventana y vuelve a intentarlo.',
};

const sourceOf = (source: SupportSource): ChatSource => ({
  id: source.id,
  description: `${DOCUMENT_TYPES[source.type] ?? source.type} · ${formatDate(source.date)}`,
  title: source.title,
});

const Answer = ({ exchange }: { exchange: Exchange }) => {
  if (exchange.status === 'pending') return <ChatMessage author="assistant" isPending />;
  if (exchange.status === 'answered') {
    return (
      <ChatMessage author="assistant" sources={exchange.sources.map(sourceOf)}>
        {exchange.answer}
      </ChatMessage>
    );
  }
  const tone = exchange.status === 'not-enough-information' ? 'notice' : 'error';
  return (
    <ChatMessage author="assistant" tone={tone}>
      {NOTICES[exchange.status]}
    </ChatMessage>
  );
};

export type SupportAssistantProps = {
  firmName: string;
  isOpen: boolean;
  conversationStatus: ConversationStatus;
  exchanges: Exchange[];
  onOpen: () => void;
  onClose: () => void;
  onAsk: (question: string) => void;
};

/** A floating assistant that answers questions about one firm from its support documents. */
export const SupportAssistant = ({
  firmName,
  isOpen,
  conversationStatus,
  exchanges,
  onOpen,
  onClose,
  onAsk,
}: SupportAssistantProps) => {
  const panelId = useId();
  const [draft, setDraft] = useState('');
  const isBusy =
    conversationStatus === 'starting' ||
    exchanges.some((exchange) => exchange.status === 'pending');
  const notice = CONVERSATION_NOTICES[conversationStatus];
  const ask = (question: string) => {
    onAsk(question);
    setDraft('');
  };

  return (
    <>
      <AssistantLauncher
        label={NAME}
        badge={BADGE}
        isExpanded={isOpen}
        controls={panelId}
        onPress={onOpen}
      />
      {isOpen && (
        <ChatPanel
          id={panelId}
          title={NAME}
          badge={BADGE}
          description={`Responde sobre ${firmName} con sus chats, notas, tickets y emails de soporte, y cita de dónde lo saca.`}
          placeholder="Pregunta todo sobre la asesoría"
          value={draft}
          onChange={setDraft}
          onSubmit={ask}
          onClose={onClose}
          isBusy={isBusy}
          isDisabled={conversationStatus !== 'ready' && conversationStatus !== 'starting'}
          suggestions={
            exchanges.length === 0 && !notice
              ? { label: 'Puedes preguntar, por ejemplo', items: EXAMPLE_QUESTIONS, onSelect: ask }
              : undefined
          }
        >
          {exchanges.map((exchange, index) => (
            // The exchanges are only ever appended, so their position identifies them.
            <div key={index} style={{ display: 'contents' }}>
              <ChatMessage author="user">{exchange.question}</ChatMessage>
              <Answer exchange={exchange} />
            </div>
          ))}
          {notice && (
            <ChatMessage author="assistant" tone="error">
              {notice}
            </ChatMessage>
          )}
        </ChatPanel>
      )}
    </>
  );
};

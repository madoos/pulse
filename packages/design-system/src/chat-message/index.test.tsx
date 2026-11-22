import { render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { ChatMessage } from '.';

const sources = [
  { id: 'SUP-0001', description: 'Ticket · 3 nov 2025', title: 'Retraso en el pago' },
  { id: 'SUP-0004', description: 'Email · 12 ene 2026', title: 'Duda sobre el IVA' },
];

describe('ChatMessage', () => {
  it('tells a question from an answer', () => {
    render(
      <>
        <ChatMessage author="user">¿Qué incidencias tiene?</ChatMessage>
        <ChatMessage author="assistant">Retrasos en los cobros.</ChatMessage>
      </>,
    );

    expect(screen.getByRole('article', { name: 'Tu pregunta' })).toHaveTextContent(
      '¿Qué incidencias',
    );
    expect(screen.getByRole('article', { name: 'Respuesta' })).toHaveTextContent('Retrasos');
  });

  it('lists the sources of an answer with what they are, when and their title', () => {
    render(
      <ChatMessage author="assistant" sources={sources}>
        Retrasos en los cobros [SUP-0001].
      </ChatMessage>,
    );

    const items = within(screen.getByRole('region', { name: 'Fuentes' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'SUP-0001Ticket · 3 nov 2025Retraso en el pago',
      'SUP-0004Email · 12 ene 2026Duda sobre el IVA',
    ]);
  });

  it('shows that it is waiting for the answer', () => {
    render(<ChatMessage author="assistant" isPending />);

    expect(screen.getByRole('article', { name: 'Respuesta' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Pensando…')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <ChatMessage author="user">¿Qué incidencias tiene?</ChatMessage>
        <ChatMessage author="assistant" sources={sources}>
          Retrasos.
        </ChatMessage>
        <ChatMessage author="assistant" tone="error">
          Error.
        </ChatMessage>
      </main>,
    );

    expect((await axe.run(document.body)).violations).toEqual([]);
  });
});

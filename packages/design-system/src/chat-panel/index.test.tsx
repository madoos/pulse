import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChatPanel, type ChatPanelProps } from '.';
import { ChatMessage } from '../chat-message';

const Controlled = (props: Partial<ChatPanelProps>) => {
  const [value, setValue] = useState('');
  return (
    <ChatPanel
      title="Intelligence Engine"
      badge="Beta"
      placeholder="Pregunta todo sobre la asesoría"
      onClose={() => {}}
      onSubmit={() => {}}
      {...props}
      value={value}
      onChange={setValue}
    />
  );
};

describe('ChatPanel', () => {
  it('is a dialog named by its title, that does not block the page', () => {
    render(<Controlled />);

    const dialog = screen.getByRole('dialog', { name: 'Intelligence Engine Beta' });
    expect(dialog).toHaveAttribute('aria-modal', 'false');
  });

  it('sends what is written, with the button and with Enter, and focuses the input', async () => {
    const onSubmit = vi.fn();
    render(<Controlled onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox', { name: 'Pregunta todo sobre la asesoría' });
    expect(input).toHaveFocus();
    await userEvent.type(input, '  ¿IVA?  ');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await userEvent.type(input, '{Enter}');

    expect(onSubmit).toHaveBeenNthCalledWith(1, '¿IVA?');
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('sends nothing while empty or busy', async () => {
    const onSubmit = vi.fn();
    render(<Controlled onSubmit={onSubmit} isBusy />);

    await userEvent.type(screen.getByRole('textbox'), '¿IVA?{Enter}');

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('closes with its button and with Escape', async () => {
    const onClose = vi.fn();
    render(<Controlled onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await userEvent.type(screen.getByRole('textbox'), '{Escape}');

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('offers questions to start with', async () => {
    const onSelect = vi.fn();
    render(
      <Controlled
        suggestions={{
          label: 'Puedes preguntar, por ejemplo',
          items: ['¿Qué incidencias recurrentes tiene?'],
          onSelect,
        }}
      />,
    );

    const suggestions = screen.getByRole('region', { name: 'Puedes preguntar, por ejemplo' });
    await userEvent.click(within(suggestions).getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith('¿Qué incidencias recurrentes tiene?');
  });

  it('shows the messages in a log announced as they arrive', () => {
    render(
      <Controlled>
        <ChatMessage author="user">¿IVA?</ChatMessage>
      </Controlled>,
    );

    expect(screen.getByRole('log', { name: 'Conversación' })).toHaveTextContent('¿IVA?');
  });

  it('has no accessibility violations', async () => {
    render(
      <Controlled
        description="Responde con los documentos de soporte."
        suggestions={{ label: 'Por ejemplo', items: ['¿IVA?'], onSelect: () => {} }}
      >
        <ChatMessage author="user">¿IVA?</ChatMessage>
        <ChatMessage author="assistant">Sin incidencias.</ChatMessage>
      </Controlled>,
    );

    expect((await axe.run(document.body)).violations).toEqual([]);
  });
});

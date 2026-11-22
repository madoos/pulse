import type { AssistantMessage } from '@pulse/contracts';
import { ApiError } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { renderWithStore } from '@shared/testing/render';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NEVER, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SupportAssistantContainer } from './SupportAssistant.container';

const CONVERSATION = '6b1f5a3e-2c4d-4e8f-9a0b-1c2d3e4f5a6b';

const answered = (question: string): AssistantMessage => ({
  id: '7c2a6b4f-3d5e-4f9a-8b1c-2d3e4f5a6b7c',
  question,
  answer: 'Retrasos recurrentes en el pago de cuotas [SUP-0001].',
  outcome: 'answered',
  sources: [
    {
      id: 'SUP-0001',
      date: '2025-11-03',
      type: 'nota_interna',
      category: 'Cobros',
      status: 'resuelto',
      title: 'Retraso en el pago de la cuota',
    },
  ],
  createdAt: '2026-11-22T10:00:00.000Z',
});

const renderAssistant = (supportAssistant = {}) => {
  const start = vi.fn((firmId: number) => of({ id: CONVERSATION, firmId, messages: [] }));
  const ask = vi.fn((_firmId: number, _conversationId: string, question: string) =>
    of(answered(question)),
  );
  const api = createFakeApi({ supportAssistant: { start, ask, ...supportAssistant } });
  renderWithStore(<SupportAssistantContainer firmId={7} firmName="Asesoría Siete" />, { api });
  return { start, ask };
};

const open = () =>
  userEvent.click(screen.getByRole('button', { name: 'Intelligence Engine Beta' }));

const chat = () => screen.getByRole('dialog', { name: 'Intelligence Engine Beta' });

describe('SupportAssistant', () => {
  it('opens a chat about the firm with the example questions of the brief', async () => {
    const { start } = renderAssistant();

    await open();

    expect(chat()).toHaveTextContent('Asesoría Siete');
    expect(
      within(chat()).getByRole('textbox', { name: 'Pregunta todo sobre la asesoría' }),
    ).toBeVisible();
    const examples = within(chat()).getByRole('region', { name: 'Puedes preguntar, por ejemplo' });
    expect(
      within(examples)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([
      '¿Qué incidencias recurrentes tiene?',
      '¿Qué sabemos sobre su forma de trabajar con IVA o renta?',
      'Resume los problemas más frecuentes de los últimos meses.',
      '¿Qué documentación respalda esa respuesta?',
    ]);
    expect(start).toHaveBeenCalledWith(7);
  });

  it('answers a question with the documents it is based on', async () => {
    const { ask } = renderAssistant();
    await open();

    await userEvent.type(within(chat()).getByRole('textbox'), '¿Problemas con los cobros?{Enter}');

    const answer = await within(chat()).findByRole('article', { name: 'Respuesta' });
    expect(answer).toHaveTextContent('Retrasos recurrentes en el pago de cuotas [SUP-0001].');
    expect(within(answer).getByRole('listitem')).toHaveTextContent(
      'SUP-0001Nota interna · 03/11/2025Retraso en el pago de la cuota',
    );
    expect(ask).toHaveBeenCalledWith(7, CONVERSATION, '¿Problemas con los cobros?');
    expect(within(chat()).getByRole('textbox')).toHaveValue('');
  });

  it('asks an example question with a click', async () => {
    const { ask } = renderAssistant();
    await open();

    await userEvent.click(
      within(chat()).getByRole('button', { name: '¿Qué incidencias recurrentes tiene?' }),
    );

    expect(within(chat()).getByRole('article', { name: 'Tu pregunta' })).toHaveTextContent(
      '¿Qué incidencias recurrentes tiene?',
    );
    expect(ask).toHaveBeenCalledOnce();
  });

  it('says so when the documents are not enough to answer', async () => {
    renderAssistant({
      ask: (_f: number, _c: string, question: string) =>
        of({ ...answered(question), answer: null, outcome: 'not-enough-information', sources: [] }),
    });
    await open();

    await userEvent.type(within(chat()).getByRole('textbox'), '¿Quién ganó el mundial?{Enter}');

    expect(await within(chat()).findByText(/No hay información suficiente/)).toBeVisible();
  });

  it('says clearly that the quota of the model ran out', async () => {
    renderAssistant({ ask: () => throwError(() => new ApiError(429)) });
    await open();

    await userEvent.type(within(chat()).getByRole('textbox'), '¿IVA?{Enter}');

    expect(
      await within(chat()).findByText(/Se ha agotado la cuota gratuita del modelo de IA/),
    ).toBeVisible();
  });

  it('says that it is not available while the model is not configured', async () => {
    renderAssistant({ start: () => throwError(() => new ApiError(503)) });

    await open();

    expect(await within(chat()).findByText(/El asistente no está disponible/)).toBeVisible();
    expect(within(chat()).getByRole('textbox')).toBeDisabled();
    expect(within(chat()).queryByRole('region', { name: /por ejemplo/ })).toBeNull();
  });

  it('waits for the answer, and closing drops the question on its way', async () => {
    renderAssistant({ ask: () => NEVER });
    await open();

    await userEvent.type(within(chat()).getByRole('textbox'), '¿IVA?{Enter}');
    expect(within(chat()).getByText('Pensando…')).toBeVisible();
    expect(within(chat()).getByRole('button', { name: 'Enviar' })).toBeDisabled();

    await userEvent.click(within(chat()).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await open();

    await waitFor(() => expect(within(chat()).queryByText('¿IVA?')).toBeNull());
  });
});

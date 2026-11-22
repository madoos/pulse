import { openPanel } from '@shared/testing/panel';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { manchega, tinerfeno } from '@network-overview/networkOverview.fixtures';
import { NeedsAttention } from './NeedsAttention';

const renderClosed = (props: Partial<Parameters<typeof NeedsAttention>[0]> = {}) =>
  render(
    <MemoryRouter>
      <NeedsAttention
        firms={[tinerfeno, manchega]}
        previousFiscalYear={2024}
        alertFilter="all"
        onAlertFilterChange={() => {}}
        {...props}
      />
    </MemoryRouter>,
  );

/** Renders the panel open, as a user who opened it sees it. */
const renderWith = async (props: Partial<Parameters<typeof NeedsAttention>[0]> = {}) => {
  renderClosed(props);
  await openPanel('Necesitan atención');
};

const firmsNamed = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...manchega,
    firm: { ...manchega.firm, id: i + 10, name: `Asesoría ${i + 1}` },
  }));

describe('NeedsAttention', () => {
  it('starts closed, with the alerts it found at a glance', () => {
    renderClosed();

    expect(screen.getByRole('button', { name: 'Necesitan atención' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('list', { name: 'Asesorías que necesitan atención' })).toBeNull();
    expect(screen.getByText('Cae la facturación 1')).toBeInTheDocument();
  });

  it('shows four advisory firms and the rest on demand', async () => {
    await renderWith({ firms: firmsNamed(6) });
    const cards = () =>
      within(screen.getByRole('list', { name: 'Asesorías que necesitan atención' })).getAllByRole(
        'link',
      );

    expect(cards()).toHaveLength(4);

    await userEvent.click(screen.getByRole('button', { name: 'Ver todas (6)' }));

    expect(cards()).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Ver menos' })).toBeInTheDocument();
  });

  it('hides "Ver todas" when every advisory firm fits', async () => {
    await renderWith();

    expect(screen.queryByRole('button', { name: /Ver todas/ })).toBeNull();
  });

  it('shows each alert with its value and its reference', async () => {
    await renderWith();
    const table = within(screen.getByRole('list', { name: 'Asesorías que necesitan atención' }));

    expect(table.getByText('Cae la facturación').closest('li')).toHaveTextContent(
      '−6,3 %300.000 €, frente a 320.000 € hace un año',
    );
    expect(table.getByText('Muchas bajas').closest('li')).toHaveTextContent(
      '8,2 % al mesla red pierde un 1,7 %',
    );
  });

  it('counts the advisory firms of each type of alert', async () => {
    await renderWith();

    expect(screen.getByRole('radio', { name: 'Todas 2' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Sin datos 0' })).toBeInTheDocument();
  });

  it('says when nothing needs attention', async () => {
    await renderWith({ firms: [] });

    expect(screen.getByRole('status')).toHaveTextContent('Ninguna asesoría necesita atención');
  });

  it('explains that the first year has no previous year', async () => {
    await renderWith({ previousFiscalYear: null });

    expect(screen.getByText(/No hay año anterior/)).toBeInTheDocument();
  });
});

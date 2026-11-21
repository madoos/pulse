import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { manchega, tinerfeno } from '@network-overview/networkOverview.fixtures';
import { NeedsAttention } from './NeedsAttention';

const renderWith = (props: Partial<Parameters<typeof NeedsAttention>[0]> = {}) =>
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

describe('NeedsAttention', () => {
  it('shows each alert with its value and its reference', () => {
    renderWith();
    const table = within(screen.getByRole('grid'));

    expect(table.getByText('Cae la facturación').closest('li')).toHaveTextContent(
      '−6,3 %300.000 €, frente a 320.000 € hace un año',
    );
    expect(table.getByText('Muchas bajas').closest('li')).toHaveTextContent(
      '8,2 % al mesla red pierde un 1,7 %',
    );
  });

  it('counts the advisory firms of each type of alert', () => {
    renderWith();

    expect(screen.getByRole('radio', { name: 'Todas 2' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Sin datos 0' })).toBeInTheDocument();
  });

  it('says when nothing needs attention', () => {
    renderWith({ firms: [] });

    expect(screen.getByRole('status')).toHaveTextContent('Ninguna asesoría necesita atención');
  });

  it('explains that the first year has no previous year', () => {
    renderWith({ previousFiscalYear: null });

    expect(screen.getByText(/No hay año anterior/)).toBeInTheDocument();
  });
});

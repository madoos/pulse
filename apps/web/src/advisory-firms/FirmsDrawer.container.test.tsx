import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '@shared/testing/render';
import { useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { FirmsDrawerContainer } from './FirmsDrawer.container';

const Url = () => {
  const { search } = useLocation();
  return <output aria-label="URL">{search}</output>;
};

const renderAt = (url: string) =>
  renderWithStore(
    <>
      <FirmsDrawerContainer />
      <Url />
    </>,
    { initialEntry: url },
  );

describe('FirmsDrawerContainer', () => {
  it('stays closed unless the URL opens it', () => {
    renderAt('/?year=2025');

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the search in the URL, so it survives a reload', async () => {
    renderAt('/?year=2025&firms=open');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar asesoría' }), 'ga');

    // The page behind the open drawer is hidden from screen readers.
    expect(screen.getByRole('status', { name: 'URL', hidden: true })).toHaveTextContent(
      '?year=2025&firms=open&q=ga',
    );
  });

  it('shows the search and the filters of the URL and clears them', async () => {
    renderAt('/?firms=open&q=gestor');

    expect(screen.getByRole('searchbox', { name: 'Buscar asesoría' })).toHaveValue('gestor');

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(screen.getByRole('searchbox', { name: 'Buscar asesoría' })).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).toBeNull();
  });

  it('closes leaving the page as it was', async () => {
    renderAt('/?year=2025&firms=open&q=gestor');

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status', { name: 'URL' })).toHaveTextContent('?year=2025');
  });
});

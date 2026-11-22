import type { AdvisoryFirmsPage, AdvisoryFirmsQuery } from '@pulse/contracts';
import { LinkRouter } from '@pulse/design-system';
import { createFakeApi } from '@shared/testing/api';
import { useListViewport } from '@shared/testing/layout';
import { renderWithStore } from '@shared/testing/render';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { useLocation, useNavigate } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { FirmsDrawerContainer } from './FirmsDrawer.container';

const viewport = useListViewport();

const firm = (id: number) => ({
  id,
  name: `Asesoría ${String(id).padStart(2, '0')}`,
  province: 'Madrid',
  city: 'Alcobendas',
  employees: 12,
  specialty: 'Fiscal',
});

const page = (from: number, to: number, nextCursor: string | null): AdvisoryFirmsPage => ({
  items: Array.from({ length: to - from + 1 }, (_, i) => firm(from + i)),
  total: 50,
  nextCursor,
});

/** Two pages of firms: the first one, and the one after the cursor `p2`. */
const pagedApi = (
  list = vi.fn((query: AdvisoryFirmsQuery) =>
    of(query.cursor === 'p2' ? page(31, 50, null) : page(1, 30, 'p2')),
  ),
) =>
  createFakeApi({
    advisoryFirms: {
      list,
      filters: () =>
        of({
          provinces: [
            { id: 28, name: 'Madrid' },
            { id: 41, name: 'Sevilla' },
          ],
          specialties: [{ code: 'fiscal', name: 'Fiscal' }],
        }),
    },
  });

const Url = () => {
  const { pathname, search, state } = useLocation();
  return (
    <output aria-label="URL" data-from={(state as { from?: string } | null)?.from}>
      {pathname}
      {search}
    </output>
  );
};

const WithRouterLinks = () => {
  const navigate = useNavigate();
  return (
    <LinkRouter navigate={navigate}>
      <FirmsDrawerContainer />
      <Url />
    </LinkRouter>
  );
};

const renderAt = (url: string, api = pagedApi()) =>
  renderWithStore(<WithRouterLinks />, {
    api,
    initialEntry: url,
    routes: { '/advisory-firms/:id': <Url /> },
  });

// The page behind the open drawer is hidden from screen readers.
const url = () => screen.getByRole('status', { name: 'URL', hidden: true });

const findList = () => screen.findByRole('grid', { name: 'Asesorías' });

describe('FirmsDrawerContainer', () => {
  it('stays closed unless the URL opens it', () => {
    renderAt('/?year=2025');

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the firms with their basic data and how many there are', async () => {
    renderAt('/?firms=open');

    const [first] = within(await findList()).getAllByRole('row');
    expect(first).toHaveTextContent('Asesoría 01');
    expect(first).toHaveTextContent('Alcobendas · Madrid');
    expect(first).toHaveTextContent('Fiscal');
    expect(first).toHaveTextContent('12 empleados');
    expect(screen.getByText('50 asesorías')).toBeInTheDocument();
  });

  it('searches once the user stops typing, keeping the search in the URL', async () => {
    const list = vi.fn(() => of(page(1, 1, null)));
    renderAt('/?year=2025&firms=open', pagedApi(list));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar asesoría' }), 'martínez');

    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(list).toHaveBeenLastCalledWith({ search: 'martínez' });
    expect(url()).toHaveTextContent('?year=2025&firms=open&q=mart%C3%ADnez');
  });

  it('filters by the provinces that come from the data', async () => {
    const list = vi.fn(() => of(page(1, 1, null)));
    renderAt('/?firms=open', pagedApi(list));

    await userEvent.click(screen.getByRole('button', { name: /Provincia/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Sevilla' }));

    expect(url()).toHaveTextContent('?firms=open&province=41');
    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ province: 41 }));
  });

  it('loads the next page when the end of the list comes into view', async () => {
    const list = vi.fn((query: AdvisoryFirmsQuery) =>
      of(query.cursor === 'p2' ? page(31, 50, null) : page(1, 30, 'p2')),
    );
    renderAt('/?firms=open&province=28', pagedApi(list));
    await findList();

    act(() => viewport.endComesIntoView());

    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ province: 28, cursor: 'p2' }));
  });

  it('says so when no firm matches', async () => {
    renderAt(
      '/?firms=open&q=zzz',
      pagedApi(vi.fn(() => of({ items: [], total: 0, nextCursor: null }))),
    );

    expect(await screen.findByText('Ninguna asesoría coincide')).toBeInTheDocument();
    expect(screen.getByText('0 asesorías')).toBeInTheDocument();
  });

  it('shows an error with a retry when the listing cannot be loaded', async () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(page(1, 1, null)));
    renderAt('/?firms=open', pagedApi(list));

    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await findList()).toBeInTheDocument();
  });

  it('opens the detail of a firm, remembering where it was opened from', async () => {
    renderAt('/?year=2025&firms=open');

    await userEvent.click(within(await findList()).getByText('Asesoría 02'));

    expect(url()).toHaveTextContent('/advisory-firms/2');
    expect(url()).toHaveAttribute('data-from', '/?year=2025&firms=open');
  });

  it('clears the search and the filters', async () => {
    renderAt('/?firms=open&q=gestor&province=28');

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(screen.getByRole('searchbox', { name: 'Buscar asesoría' })).toHaveValue('');
    expect(url()).toHaveTextContent('?firms=open');
  });

  it('closes leaving the page as it was', async () => {
    renderAt('/?year=2025&firms=open&q=gestor');

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status', { name: 'URL' })).toHaveTextContent('?year=2025');
  });
});

import { openPanel } from '@shared/testing/panel';
import { ApiError } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { renderWithStore } from '@shared/testing/render';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { NetworkOverviewContainer } from './NetworkOverview.container';
import {
  highlights,
  performance2024,
  performance2025,
  specialtyGroups,
} from './networkOverview.fixtures';

const api = (overrides: Parameters<typeof createFakeApi>[0] = {}) =>
  createFakeApi({
    network: {
      fiscalYears: () => of({ fiscalYears: [2025, 2024, 2023] }),
      performance: (query) =>
        of({ years: query.compareWith ? [performance2025, performance2024] : [performance2025] }),
      highlights: () => of(highlights),
      groups: () => of({ groups: specialtyGroups }),
      ...overrides.network,
    },
  });

const renderAt = (search: string, fakeApi = api()) =>
  renderWithStore(<NetworkOverviewContainer />, {
    api: fakeApi,
    initialEntry: `/${search}`,
  });

describe('NetworkOverviewContainer', () => {
  it('shows the KPIs of the most recent year, without comparison', async () => {
    renderAt('');

    const revenue = await screen.findByRole('article', { name: 'Facturación' });
    expect(revenue).toHaveTextContent('16.600.000');
    expect(revenue).not.toHaveTextContent('antes');
    expect(
      screen.getByText('Estás viendo todo el año 2025-26, sin comparar con otro año.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Bajas al mes' })).toHaveTextContent('1,5 %');
    await openPanel('Filtros');
    expect(screen.getByRole('button', { name: /Año fiscal/ })).toHaveTextContent('2025-26');
    expect(screen.getByRole('button', { name: /Comparar con/ })).toHaveTextContent('Ninguno');
  });

  it('compares the KPIs with the year in the URL', async () => {
    renderAt('?year=2025&compare=2024');

    const revenue = await screen.findByRole('article', { name: 'Facturación' });
    expect(revenue).toHaveTextContent('+21,2 % · antes 13.700.000 €');
    expect(screen.getAllByRole('list', { name: 'Leyenda' })[0]).toHaveTextContent('2025-262024-25');
    expect(screen.getByRole('article', { name: 'Bajas al mes' })).toHaveTextContent('−0,1 p.p.');
  });

  it('lists the advisory firms that need attention and filters them by alert', async () => {
    renderAt('');

    const panel = await screen.findByRole('region', { name: 'Necesitan atención' });
    await openPanel('Necesitan atención');
    expect(within(panel).getByRole('link', { name: 'Gabinete Fiscal Tinerfeño' })).toHaveAttribute(
      'href',
      '/advisory-firms/1',
    );
    const cards = within(panel).getByRole('list', { name: 'Asesorías que necesitan atención' });
    expect(within(cards).getByText('Pierde clientes')).toBeInTheDocument();
    expect(within(panel).getByText('periodo')).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('radio', { name: 'Muchas bajas 1' }));

    expect(within(panel).queryByRole('link', { name: 'Gabinete Fiscal Tinerfeño' })).toBeNull();
    expect(
      within(panel).getByRole('link', { name: 'Gestoria Manchega Integral' }),
    ).toBeInTheDocument();
  });

  it('marks the standouts that also need attention', async () => {
    renderAt('');

    const panel = await screen.findByRole('region', { name: 'Asesorías que destacan' });
    const cards = within(
      within(panel).getByRole('list', { name: 'Asesorías que más crecen en clientes' }),
    ).getAllByRole('listitem');
    expect(cards[0]).toHaveTextContent(/Asesoría Fiscal del Norte.*\+40,8/);
    expect(cards[0]).not.toHaveTextContent('También necesita atención');
    expect(cards[1]).toHaveTextContent('También necesita atención');
  });

  it('shows the group table while grouped, and loads the groups only then', async () => {
    const groups = vi.fn(() => of({ groups: specialtyGroups }));
    renderAt('?group=specialty', api({ network: { groups } }));

    const panel = await screen.findByRole('region', { name: 'Por especialidad' });
    expect(panel).toHaveTextContent('2 especialidades');
    await userEvent.click(within(panel).getByRole('button', { name: 'Por especialidad' }));
    const [, first] = within(panel).getAllByRole('row');
    expect(first).toHaveTextContent('Laboral');
    expect(groups).toHaveBeenCalledOnce();
  });

  it('changes the URL when a filter changes', async () => {
    const performance = vi.fn(() => of({ years: [performance2025, performance2024] }));
    renderAt('', api({ network: { performance } }));

    await openPanel('Filtros');
    await userEvent.click(await screen.findByRole('button', { name: /Comparar con/ }));
    await userEvent.click(screen.getByRole('option', { name: '2024-25' }));

    expect(await screen.findByRole('article', { name: 'Facturación' })).toHaveTextContent(
      '+21,2 % · antes 13.700.000 €',
    );
    expect(performance).toHaveBeenLastCalledWith({
      fiscalYear: 2025,
      compareWith: 2024,
      fromMonth: 4,
      toMonth: 3,
    });
  });

  it('shows an error and retries when a section cannot be loaded', async () => {
    const failing = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new ApiError(500)))
      .mockReturnValue(of(highlights));
    renderAt('', api({ network: { highlights: failing } }));

    const [alert] = await screen.findAllByRole('alert');
    expect(alert).toHaveTextContent('No se han podido cargar las alertas');

    await userEvent.click(within(alert!).getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('region', { name: 'Necesitan atención' })).toBeInTheDocument();
  });

  it('says so when there are no years with data to show', async () => {
    renderAt('', api({ network: { fiscalYears: () => throwError(() => new ApiError(503)) } }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se han podido cargar los años con datos',
    );
  });
});

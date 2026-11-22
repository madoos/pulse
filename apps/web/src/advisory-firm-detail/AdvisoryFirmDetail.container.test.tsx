import type { FirmMonthlyPoint, FirmPerformance } from '@pulse/contracts';
import { ApiError } from '@shared/api';
import { createFakeApi } from '@shared/testing/api';
import { renderWithStore } from '@shared/testing/render';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import type { InitialEntry } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AdvisoryFirmDetailContainer } from './AdvisoryFirmDetail.container';

const point = (month: string, activeClients: number, revenue: number): FirmMonthlyPoint => ({
  month,
  activeClients,
  revenue,
  revenuePerClient: revenue / activeClients,
  churnRate: 0.02,
  taxFilings: 40,
  revenuePerEmployee: revenue / 10,
  incidentRate: 0.02,
});

const performance: FirmPerformance = {
  years: [
    {
      fiscalYear: 2025,
      summary: {
        activeClients: 120,
        revenue: 30_000,
        revenuePerClient: 250,
        churnRate: 0.02,
        taxFilings: 480,
        revenuePerEmployee: 3_000,
        incidentRate: 0.025,
      },
      months: [point('2025-04', 100, 10_000), point('2026-03', 120, 12_000)],
    },
  ],
  sixMonthsAgo: {
    current: point('2026-03', 120, 12_000),
    previous: point('2025-09', 100, 10_000),
    specialty: { current: point('2026-03', 110, 11_500), previous: point('2025-09', 100, 10_000) },
  },
  specialty: {
    firms: 8,
    summary: {
      activeClients: 110,
      revenue: 25_000,
      revenuePerClient: 220,
      churnRate: 0.02,
      taxFilings: 400,
      revenuePerEmployee: 2_500,
      incidentRate: 0.015,
    },
    months: [point('2025-04', 95, 9_000), point('2026-03', 110, 11_500)],
  },
  alerts: [
    { type: 'losing-clients', value: 120, reference: 130 },
    { type: 'high-churn', value: 0.03, reference: 0.015 },
  ],
  alertsComparedWith: 2024,
};

const renderAt = (
  initialEntry: InitialEntry,
  api = createFakeApi({ advisoryFirms: { performance: () => of(performance) } }),
) =>
  renderWithStore(<AdvisoryFirmDetailContainer />, {
    api,
    path: '/advisory-firms/:id',
    initialEntry,
  });

describe('AdvisoryFirmDetailContainer', () => {
  it('shows the profile of the firm', async () => {
    renderAt('/advisory-firms/7');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Asesoría 7' }),
    ).toBeInTheDocument();
    const profile = screen.getByRole('region', { name: 'Datos de la asesoría' });
    expect(profile).toHaveTextContent('CIFB00000000');
    expect(profile).toHaveTextContent('Alta01/01/2020');
    expect(profile).toHaveTextContent('Empleados10');
  });

  it('measures the firm as the network is, with its tax filings', async () => {
    renderAt('/advisory-firms/7');

    const indicators = await screen.findByRole('region', { name: 'Indicadores' });
    for (const label of [
      'Clientes activos',
      'Facturación',
      'Bajas al mes',
      'Facturación por empleado',
      'Declaraciones',
      'Incidencias con Hacienda',
    ]) {
      expect(within(indicators).getByRole('article', { name: label })).toBeInTheDocument();
    }
    expect(within(indicators).getByText('480')).toBeInTheDocument();
    expect(
      within(indicators).getByRole('article', { name: 'Facturación por empleado' }),
    ).toHaveTextContent('3.000 €');
  });

  it('shows how often its tax filings go wrong, worse than its specialty in red', async () => {
    renderAt('/advisory-firms/7');

    const indicators = await screen.findByRole('region', { name: 'Indicadores' });
    expect(
      within(indicators).getByRole('article', { name: 'Incidencias con Hacienda' }),
    ).toHaveTextContent('2,5 %');
    const specialty = screen.getByRole('region', { name: 'Frente a su especialidad' });
    expect(
      within(specialty).getByRole('article', { name: 'Incidencias con Hacienda' }),
    ).toHaveTextContent('+1,0 p.p. · su especialidad 1,5 %');
  });

  it('shows in red what goes wrong, against the previous year', async () => {
    renderAt('/advisory-firms/7');

    const alerts = await screen.findByRole('list', { name: 'Alertas' });
    const [clients, churn] = within(alerts).getAllByRole('listitem');
    expect(clients).toHaveTextContent('Pierde clientes');
    expect(clients).toHaveTextContent('120 clientes, tenía 130 hace un año');
    expect(churn).toHaveTextContent('Muchas bajas');
    expect(screen.getByText('Frente a los mismos meses de 2024-25.')).toBeInTheDocument();
  });

  it('says so when nothing goes wrong', async () => {
    renderAt(
      '/advisory-firms/7',
      createFakeApi({ advisoryFirms: { performance: () => of({ ...performance, alerts: [] }) } }),
    );

    expect(await screen.findByText('Sin alertas')).toBeInTheDocument();
  });

  it('compares the last month with six months before', async () => {
    renderAt('/advisory-firms/7');

    const table = await screen.findByRole('grid', { name: 'mar 2026 frente a sep 2025' });
    const revenue = within(table)
      .getAllByRole('row')
      .find((row) => row.textContent?.startsWith('Facturación1'))!;
    expect(revenue).toHaveTextContent('12.000 €');
    expect(revenue).toHaveTextContent('10.000 €');
    expect(revenue).toHaveTextContent('+20,0 %');
    // Its specialty grew +15,0 % in the same months: the firm, 5 points more.
    expect(revenue).toHaveTextContent('+15,0 %');
    expect(revenue).toHaveTextContent('+5,0 p.p.');
  });

  it('sets the firm against the average firm of the rest of its specialty', async () => {
    renderAt('/advisory-firms/7');

    const section = await screen.findByRole('region', { name: 'Frente a su especialidad' });
    expect(within(section).getByText('Media de Fiscal (8 asesorías)')).toBeInTheDocument();
    const revenue = within(section).getByRole('article', { name: 'Facturación' });
    expect(revenue).toHaveTextContent('30.000 €');
    expect(revenue).toHaveTextContent('+20,0 % · su especialidad 25.000 €');
  });

  it('says so when no other firm shares its specialty', async () => {
    renderAt(
      '/advisory-firms/7',
      createFakeApi({
        advisoryFirms: {
          performance: () =>
            of({ ...performance, specialty: { ...performance.specialty, firms: 0, months: [] } }),
        },
      }),
    );

    expect(
      await screen.findByText('No hay más asesorías de Fiscal con datos en el periodo'),
    ).toBeInTheDocument();
  });

  it('asks for the firm with the filters of the URL, and for a compared year when chosen', async () => {
    const load = vi.fn(() => of(performance));
    renderAt(
      '/advisory-firms/7?year=2025&from=10',
      createFakeApi({ advisoryFirms: { performance: load } }),
    );
    await waitFor(() =>
      expect(load).toHaveBeenCalledWith(7, { fiscalYear: 2025, fromMonth: 10, toMonth: 3 }),
    );

    await userEvent.click(screen.getByRole('button', { name: /Comparar con/ }));
    await userEvent.click(await screen.findByRole('option', { name: '2024-25' }));

    await waitFor(() =>
      expect(load).toHaveBeenLastCalledWith(7, {
        fiscalYear: 2025,
        fromMonth: 10,
        toMonth: 3,
        compareWith: 2024,
      }),
    );
    expect(screen.queryByRole('button', { name: /Agrupar por/ })).toBeNull();
  });

  it('says so when the firm does not exist', async () => {
    renderAt(
      '/advisory-firms/99',
      createFakeApi({ advisoryFirms: { get: () => throwError(() => new ApiError(404)) } }),
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Asesoría no encontrada' }),
    ).toBeInTheDocument();
  });

  it('goes back to the page it was opened from, keeping it through filter changes', async () => {
    renderAt({ pathname: '/advisory-firms/7', state: { from: '/?firms=open&q=gestor' } });

    await userEvent.click(await screen.findByRole('button', { name: /Comparar con/ }));
    await userEvent.click(await screen.findByRole('option', { name: '2024-25' }));

    expect(screen.getByRole('link', { name: '← Volver' })).toHaveAttribute(
      'href',
      '/?firms=open&q=gestor',
    );
  });
});

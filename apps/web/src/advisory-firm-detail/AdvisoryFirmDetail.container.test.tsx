import { renderWithStore } from '@shared/testing/render';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdvisoryFirmDetailContainer } from './AdvisoryFirmDetail.container';

describe('AdvisoryFirmDetailContainer', () => {
  it('shows the frame of the detail, opened directly by its URL', () => {
    renderWithStore(<AdvisoryFirmDetailContainer />, {
      path: '/advisory-firms/:id',
      initialEntry: '/advisory-firms/7',
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Asesoría 7' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Volver' })).toHaveAttribute('href', '/');
    for (const name of ['Datos de la asesoría', 'Último mes', 'Evolución mensual', 'Mes a mes']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('goes back to the page it was opened from', () => {
    renderWithStore(<AdvisoryFirmDetailContainer />, {
      path: '/advisory-firms/:id',
      initialEntry: { pathname: '/advisory-firms/7', state: { from: '/?firms=open&q=gestor' } },
    });

    expect(screen.getByRole('link', { name: '← Volver' })).toHaveAttribute(
      'href',
      '/?firms=open&q=gestor',
    );
  });
});

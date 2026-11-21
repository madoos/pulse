import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { PageHeader } from '.';

describe('PageHeader', () => {
  it('gives the page its h1, with a way back and actions', () => {
    render(
      <PageHeader
        title="Gestoria Manchega"
        description="Fiscal · Albacete"
        back={<a href="/">Volver</a>}
        actions={<button type="button">Exportar</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Gestoria Manchega' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<PageHeader title="Vista de red" />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

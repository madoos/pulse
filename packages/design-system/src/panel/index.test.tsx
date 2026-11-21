import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Panel } from '.';

describe('Panel', () => {
  it('is a region named by its title', () => {
    render(
      <Panel title="Necesitan atención" description="Frente al año anterior" aside="3">
        <p>Contenido</p>
      </Panel>,
    );

    expect(screen.getByRole('region', { name: 'Necesitan atención' })).toHaveTextContent(
      'Frente al año anterior',
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Necesitan atención' }),
    ).toBeInTheDocument();
  });

  it('opens and closes a collapsible panel from its title', async () => {
    render(
      <Panel title="Por especialidad" collapsible summary="3 especialidades">
        <p>Tabla</p>
      </Panel>,
    );
    const toggle = screen.getByRole('button', { name: 'Por especialidad' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('3 especialidades')).toBeVisible();
    expect(screen.queryByText('Tabla')).not.toBeVisible();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Tabla')).toBeVisible();
    expect(screen.queryByText('3 especialidades')).toBeNull();
  });

  it('has no accessibility violations when collapsible', async () => {
    const { container } = render(
      <Panel title="Grupos" collapsible summary="Resumen">
        <p>Contenido</p>
      </Panel>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Panel title="Grupos" headingLevel={3}>
        <p>Contenido</p>
      </Panel>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

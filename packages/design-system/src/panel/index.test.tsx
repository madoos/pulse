import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
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

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Panel title="Grupos" headingLevel={3}>
        <p>Contenido</p>
      </Panel>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

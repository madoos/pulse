import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { Sparkline } from '.';

describe('Sparkline', () => {
  it('is an image described by its label', () => {
    render(<Sparkline label="Clientes de abril a marzo" values={[1, 3, 2]} />);

    expect(screen.getByRole('img', { name: 'Clientes de abril a marzo' })).toBeInTheDocument();
  });

  it('leaves a gap for the missing values', () => {
    const { container } = render(<Sparkline label="Con huecos" values={[1, 2, null, 3, 4]} />);

    const path = container.querySelector('path')?.getAttribute('d') ?? '';
    expect(path.match(/M/g)).toHaveLength(2);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Sparkline label="Facturación" values={[1, 2, 3]} />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

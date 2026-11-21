import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { Message } from '.';

describe('Message', () => {
  it('announces information politely', () => {
    render(<Message title="Nada que mostrar" />);

    expect(screen.getByRole('status')).toHaveTextContent('Nada que mostrar');
  });

  it('announces an error right away, with its details and action', () => {
    render(
      <Message tone="error" title="Error" action={<button type="button">Reintentar</button>}>
        La API no responde
      </Message>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('ErrorLa API no responde');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Message tone="error" title="Error" />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

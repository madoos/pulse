import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GroupBySelect } from './GroupBySelect';

describe('GroupBySelect', () => {
  it('reports the grouping chosen', async () => {
    const onChange = vi.fn();
    render(<GroupBySelect groupBy={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /Agrupar por/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Especialidad' }));

    expect(onChange).toHaveBeenCalledWith({ groupBy: 'specialty' });
  });

  it('reports no grouping when "Ninguno" is chosen', async () => {
    const onChange = vi.fn();
    render(<GroupBySelect groupBy="specialty" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /Agrupar por/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Ninguno' }));

    expect(onChange).toHaveBeenCalledWith({ groupBy: null });
  });
});

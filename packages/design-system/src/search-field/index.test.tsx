import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { SearchField } from '.';

describe('SearchField', () => {
  it('reports what is typed and clears it', async () => {
    const onChange = vi.fn();
    render(<SearchField label="Buscar asesoría" onChange={onChange} />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar asesoría' }), 'ga');
    await userEvent.click(screen.getByRole('button', { name: 'Borrar la búsqueda' }));

    expect(onChange).toHaveBeenNthCalledWith(2, 'ga');
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('keeps a hidden label for screen readers', () => {
    render(<SearchField label="Buscar asesoría" hideLabel />);

    expect(screen.getByRole('searchbox', { name: 'Buscar asesoría' })).toBeInTheDocument();
  });

  it('searches with its button as with Enter, when it has one', async () => {
    const onSubmit = vi.fn();
    render(<SearchField label="Buscar asesoría" submitLabel="Buscar" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar asesoría' }), 'gest{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSubmit).toHaveBeenNthCalledWith(1, 'gest');
    expect(onSubmit).toHaveBeenNthCalledWith(2, 'gest');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SearchField label="Buscar asesoría" defaultValue="ga" />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

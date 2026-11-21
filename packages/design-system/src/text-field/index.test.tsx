import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '.';

describe('TextField', () => {
  it('is labelled and reports what is typed', async () => {
    const onChange = vi.fn();
    render(<TextField label="Email" onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'ana');

    expect(onChange).toHaveBeenLastCalledWith('ana');
  });

  it('shows the error message when invalid', () => {
    render(<TextField label="Email" isInvalid errorMessage="Escribe un email válido" />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Escribe un email válido')).toBeInTheDocument();
  });

  it('can hide what is typed, for passwords', () => {
    render(<TextField label="Contraseña" type="password" />);

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TextField label="Email" isInvalid errorMessage="Obligatorio" />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});

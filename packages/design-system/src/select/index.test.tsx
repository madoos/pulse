import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { Select } from '.';

const options = [
  { id: '2025', label: '2025-26' },
  { id: '2024', label: '2024-25' },
];

describe('Select', () => {
  it('shows the selected option and lets the user pick another', async () => {
    const onSelectionChange = vi.fn();
    render(
      <Select
        label="Año fiscal"
        options={options}
        selectedKey="2025"
        onSelectionChange={onSelectionChange}
      />,
    );

    const button = screen.getByRole('button', { name: /Año fiscal/ });
    expect(button).toHaveTextContent('2025-26');

    await userEvent.click(button);
    await userEvent.click(screen.getByRole('option', { name: '2024-25' }));

    expect(onSelectionChange).toHaveBeenCalledWith('2024');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Select
        label="Año fiscal"
        options={options}
        selectedKey="2025"
        onSelectionChange={() => {}}
      />,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

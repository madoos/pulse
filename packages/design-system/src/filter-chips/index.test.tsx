import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { FilterChips } from '.';

const chips = [
  { id: 'all', label: 'Todas', count: 3 },
  { id: 'high-churn', label: 'Muchas bajas', count: 1 },
];

describe('FilterChips', () => {
  it('marks the selected chip and selects another one', async () => {
    const onSelectionChange = vi.fn();
    render(
      <FilterChips
        label="Filtrar"
        chips={chips}
        selectedKey="all"
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Todas 3' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Muchas bajas 1' }));

    expect(onSelectionChange).toHaveBeenCalledWith('high-churn');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <FilterChips label="Filtrar" chips={chips} selectedKey="all" onSelectionChange={() => {}} />,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});

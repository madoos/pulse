import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '.';

describe('Button', () => {
  it('calls onPress when clicked', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledOnce();
  });

  it('can be pressed with the keyboard', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onPress).toHaveBeenCalledOnce();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = vi.fn();
    render(
      <Button onPress={onPress} isDisabled>
        Save
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button variant="secondary">Save</Button>);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});

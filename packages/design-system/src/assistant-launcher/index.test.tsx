import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { AssistantLauncher } from '.';

describe('AssistantLauncher', () => {
  it('is a button named by its label and its badge, that opens the assistant', async () => {
    const onPress = vi.fn();
    render(
      <AssistantLauncher
        label="Intelligence Engine"
        badge="Beta"
        isExpanded={false}
        onPress={onPress}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Intelligence Engine Beta' }));

    expect(onPress).toHaveBeenCalledOnce();
  });

  it('tells whether the window it opens is open', () => {
    render(
      <AssistantLauncher
        label="Intelligence Engine"
        isExpanded
        controls="chat"
        onPress={() => {}}
      />,
    );

    expect(screen.getByRole('button', { hidden: true })).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no accessibility violations', async () => {
    render(
      <AssistantLauncher
        label="Intelligence Engine"
        badge="Beta"
        isExpanded={false}
        onPress={() => {}}
      />,
    );

    expect((await axe.run(document.body)).violations).toEqual([]);
  });
});

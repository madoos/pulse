import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionMenu } from './SessionMenu';

describe('SessionMenu', () => {
  it('shows who is logged in', () => {
    render(<SessionMenu email="ana@example.com" onLogOut={() => {}} />);

    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('logs out when asked', async () => {
    const onLogOut = vi.fn();
    render(<SessionMenu email="ana@example.com" onLogOut={onLogOut} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(onLogOut).toHaveBeenCalledOnce();
  });
});

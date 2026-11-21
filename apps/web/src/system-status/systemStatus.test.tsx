import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SystemStatus } from './SystemStatus';

describe('SystemStatus', () => {
  it('shows that the API is being checked', () => {
    render(<SystemStatus status="checking" onRetry={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent('Comprobando la API…');
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('shows that the API is up', () => {
    render(<SystemStatus status="up" onRetry={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent('API operativa');
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('offers a retry when the API is down', async () => {
    const onRetry = vi.fn();
    render(<SystemStatus status="down" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(screen.getByRole('status')).toHaveTextContent('API no disponible');
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

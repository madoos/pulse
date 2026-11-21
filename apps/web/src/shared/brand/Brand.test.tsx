import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Brand } from './Brand';

describe('Brand', () => {
  it('shows the logo of Asevia and the name of the application', () => {
    render(<Brand />);

    expect(screen.getByRole('img', { name: 'Asevia' })).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
  });
});

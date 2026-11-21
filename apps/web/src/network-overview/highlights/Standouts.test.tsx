import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Standouts } from './Standouts';

describe('Standouts', () => {
  it('says there is nothing to compare with in the first year', () => {
    render(
      <MemoryRouter>
        <Standouts standouts={[]} needsAttention={[]} previousFiscalYear={null} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'No hay un año anterior con el que comparar',
    );
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from '.';

const renderDrawer = (onOpenChange = vi.fn()) =>
  render(
    <Drawer title="Asesorías" aside="50" isOpen onOpenChange={onOpenChange}>
      <input aria-label="Buscar" />
    </Drawer>,
  );

describe('Drawer', () => {
  it('is a dialog named by its title', () => {
    renderDrawer();

    expect(screen.getByRole('dialog', { name: 'Asesorías' })).toHaveTextContent('50');
  });

  it('closes with its button and with Escape', async () => {
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders nothing while closed', () => {
    render(
      <Drawer title="Asesorías" isOpen={false} onOpenChange={() => {}}>
        <p>Contenido</p>
      </Drawer>,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    renderDrawer();

    expect((await axe.run(document.body)).violations).toEqual([]);
  });
});

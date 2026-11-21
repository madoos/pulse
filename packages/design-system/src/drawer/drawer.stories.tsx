import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Drawer } from '.';
import { Button } from '../button';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  args: {
    title: 'Asesorías',
    aside: '50',
    isOpen: true,
    onOpenChange: () => {},
    children: <p>El buscador, los filtros y la lista.</p>,
  },
  render: function Render(args) {
    const [isOpen, setOpen] = useState(args.isOpen);
    return (
      <>
        <Button onPress={() => setOpen(true)}>Abrir</Button>
        <Drawer {...args} isOpen={isOpen} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

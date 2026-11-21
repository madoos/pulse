import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell, SideNavLink } from '.';
import { Panel } from '../panel';
import { PageHeader } from '../page-header';

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: {
    brand: 'Pulse',
    navigation: (
      <>
        <SideNavLink href="#" isCurrent icon="▣">
          Vista de red
        </SideNavLink>
        <SideNavLink href="#" icon="☰">
          Asesorías
        </SideNavLink>
      </>
    ),
    user: <span>ana@example.com</span>,
    children: (
      <>
        <PageHeader title="Vista de red" description="Cómo va la red de asesorías" />
        <Panel title="Indicadores">
          <p>Contenido</p>
        </Panel>
      </>
    ),
  },
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

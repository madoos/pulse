import type { Meta, StoryObj } from '@storybook/react-vite';
import { AssistantLauncher } from '.';

const meta = {
  title: 'Components/AssistantLauncher',
  component: AssistantLauncher,
  args: { label: 'Intelligence Engine', badge: 'Beta', isExpanded: false, onPress: () => {} },
} satisfies Meta<typeof AssistantLauncher>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutBadge: Story = { args: { badge: undefined } };

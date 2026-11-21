import type { Preview } from '@storybook/react-vite';
import '../src/tokens/index.scss';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    a11y: { test: 'error' },
  },
};

export default preview;

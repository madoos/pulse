import react from '@vitejs/plugin-react';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [react()],
  test: {
    name: 'design-system',
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});

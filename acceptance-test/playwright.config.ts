import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { BASE_URL } from './support/environment';

// The .feature files are the specification: playwright-bdd turns each scenario into a test.
// Only the scenarios tagged @e2e run end to end; the rest are covered by lower-level tests.
const testDir = defineBddConfig({
  features: '*.feature',
  steps: ['support/fixtures.ts', 'steps/**/*.ts'],
  tags: '@e2e',
});

export default defineConfig({
  testDir,
  globalSetup: './support/waitForSystem.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'es-ES',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

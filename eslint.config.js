import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/dist',
      '**/coverage',
      '**/storybook-static',
      'acceptance-test/.features-gen',
      'acceptance-test/playwright-report',
      'acceptance-test/test-results',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  // The SonarQube Cloud rules for JavaScript and TypeScript, so they fail locally before the analysis in CI.
  sonarjs.configs.recommended,
  { languageOptions: { globals: { ...globals.node } } },
  {
    files: ['apps/web/**', 'packages/design-system/**'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    // Epic tests assert inside expectEpic (marble testing), which the rule cannot see.
    files: ['**/*.epics.test.ts'],
    rules: { 'sonarjs/assertions-in-tests': 'off' },
  },
  {
    // Playwright fixtures must destructure their dependencies, even when they have none.
    files: ['acceptance-test/support/fixtures.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  // Turns off style rules that Prettier already handles.
  prettier,
);

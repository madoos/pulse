import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    main: 'src/main.ts',
    migrate: 'src/shared/infrastructure/database/migrate.ts',
    'create-user': 'src/auth/infrastructure/cli/create-user.ts',
  },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
  noExternal: [/.*/],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});

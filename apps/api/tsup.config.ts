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
  // Everything is bundled but the embedding library: its native binaries (ONNX Runtime) cannot
  // be, so the image installs it (ADR-0023).
  noExternal: [/^(?!@huggingface\/transformers).*/],
  banner: {
    // Aliased so it does not clash with bundled dependencies that import createRequire themselves.
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
});

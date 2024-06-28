import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    env: loadEnv('', process.cwd()),
    setupFiles: ['dotenv/config'],
    coverage: {
      enabled: true,
    },
  },
});

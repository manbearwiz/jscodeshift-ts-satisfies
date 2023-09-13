import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
});

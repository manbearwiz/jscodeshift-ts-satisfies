import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      exclude: ['*.config.?(c|m)[jt]s'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
});

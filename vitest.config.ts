import type { ViteUserConfig } from 'vitest/config';
export default {
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      exclude: ['*.config.?(c|m)[jt]s', 'dist'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
} satisfies ViteUserConfig;

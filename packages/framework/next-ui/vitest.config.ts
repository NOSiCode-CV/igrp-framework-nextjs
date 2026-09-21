import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // `.tsx` too: the include used to stop at `.ts`, so no component test could
    // be added to this package without first editing this file.
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    passWithNoTests: false,
  },
  resolve: {
    conditions: ['import', 'default'],
  },
});

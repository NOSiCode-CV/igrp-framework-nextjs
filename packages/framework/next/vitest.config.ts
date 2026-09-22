import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // `.tsx` too: the include used to stop at `.ts`, so the layout providers —
    // async Server Components in `.tsx` — could not be tested at all without
    // first editing this file. `next-ui` had already closed the same gap.
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    passWithNoTests: false,
  },
  resolve: {
    conditions: ['import', 'default'],
    alias: [
      {
        find: /^server-only$/,
        replacement: fileURLToPath(
          new URL('./scripts/vitest-server-only-stub.ts', import.meta.url),
        ),
      },
    ],
  },
});

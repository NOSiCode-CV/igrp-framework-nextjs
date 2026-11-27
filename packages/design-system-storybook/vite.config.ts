/// <reference types="vitest/config" />
/// <reference types="vite/client" />
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react';
import path from 'path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const require = createRequire(import.meta.url);

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // vite-plugin-storybook-nextjs aliases `react` to next/dist/compiled/react/index.js, which turns
    // `react/compiler-runtime` (imported by the React-Compiler-built DS dist) into `index.js/compiler-runtime`.
    // Object form on purpose: the plugin's alias object merges into this one, so this key stays first.
    alias: {
      'react/compiler-runtime': require.resolve('next/dist/compiled/react/compiler-runtime.js'),
    },
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(import.meta.dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});

import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import jsxA11y from "eslint-plugin-jsx-a11y"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

import igrp from "./eslint-rules/token-policy.js"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Primitives: raw palette banned, but shadcn's `dark:` opacity adjustments
    // of semantic tokens are kept so the layer stays alignable with upstream.
    files: ["src/components/primitives/**/*.{ts,tsx}"],
    plugins: { igrp },
    rules: {
      "igrp/token-policy": ["error", { allowDarkVariant: true }],

      // Same rationale as `allowDarkVariant`: these three fire on *unmodified*
      // upstream shadcn markup, so enforcing them here would create permanent
      // drift that `scripts/check-shadcn-drift.mjs` reports on every release.
      //   - input-group's addon is a focusable role="group" that forwards clicks
      //     and keys to the input it wraps (no-noninteractive-*).
      //   - pagination's <a> takes its content through {...props} (anchor-has-content).
      // They stay errors in the Horizon and Custom layers, which we do own.
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-noninteractive-tabindex": "off",
      "jsx-a11y/anchor-has-content": "off",
    },
  },
  {
    // Horizon and Custom compose Primitives + semantic tokens: no `dark:` at all.
    files: [
      "src/components/horizon/**/*.{ts,tsx}",
      "src/components/custom/**/*.{ts,tsx}",
    ],
    plugins: { igrp },
    rules: {
      "igrp/token-policy": "error",
    },
  },
])

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
    // Primitives are ported verbatim from the shadcn registry and kept aligned by
    // `scripts/check-shadcn-drift.mjs`. Rules that upstream does not satisfy are
    // switched off here rather than fixed in the file: editing them to please a
    // linter creates permanent drift on every shadcn release.
    files: ["src/components/primitives/**/*.{ts,tsx}"],
    plugins: { igrp },
    rules: {
      "igrp/token-policy": ["error", { allowDarkVariant: true }],
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-noninteractive-tabindex": "off",
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/click-events-have-key-events": "off",
    },
  },
  {
    // `use-mobile` is the upstream shadcn hook, shipped with its sidebar. Its
    // mount-time `setIsMobile` is the documented pattern for reading a media
    // query before first paint; same drift reasoning as the primitives above.
    files: ["src/hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // `src/lib` is in here deliberately: IGRPColors lives there, and it is the
    // class map every badge, alert, card and stats-card pulls from. Scoping the
    // policy to components only meant a raw palette colour added to that map
    // passed lint and shipped to every consumer of the slot.
    files: ["src/components/horizon/**/*.{ts,tsx}", "src/components/custom/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    plugins: { igrp },
    rules: {
      "igrp/token-policy": "error",
    },
  },
])

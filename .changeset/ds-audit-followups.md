---
"@igrp/igrp-framework-react-design-system": patch
---

Design-system audit follow-ups (no public API breaks):

- **`src/lib/colors.ts`**: replace raw Tailwind palette references (`text-emerald-700 dark:text-emerald-400`, `bg-red-500`, etc.) with semantic tokens (`text-success`, `bg-destructive`, …). Dark mode is now driven entirely by token theming. The `IGRPColors` shape and all exported types are unchanged.
- **`tokens.css`**: add `--destructive-foreground`, `--indigo`, `--indigo-foreground` light and dark values plus their `@theme inline` entries, so `colors.ts` (and downstream consumers) can express the full destructive/indigo roles via semantic tokens.
- **`IGRPForm`**: the `defaultValues` sync effect now skips reset when the form is dirty, so a parent re-rendering with a new `defaultValues` object reference no longer clobbers user input. Consumers that *want* to overwrite dirty state should bump `resetKey` or call `formRef.current?.reset()` explicitly.
- **`IGRPDataTable`**: extract `IGRPDataTableRowActions` to a separate file (`data-table/row-actions-cell.tsx`) without the `"use no memo"` directive, so the React Compiler can memoize per-row renders. The parent table file still opts out (required for `useReactTable`).
- **Docs**: document the shadcn drift-checker script and the primitives-layer `dark:` policy in the package CLAUDE.md + README.
- **Tests**: add a Vitest + React Testing Library setup (jsdom) with focused unit tests for `IGRPForm` (submit/validation/global error/dirty guard/pristine sync), `IGRPInputText` (label, helper, error, required), and `IGRPDataTable` (smoke + empty-state).

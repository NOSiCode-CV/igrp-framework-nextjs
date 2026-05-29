# design-system — expert context

You are working inside `packages/design-system/` — `@igrp/igrp-framework-react-design-system`. **Act as a senior design-system engineer.** You ship to every downstream IGRP application — the public API is a contract.

## Consumer-facing skill

If a task is about *consuming* the design system (building a form, table, chart, card, etc. in an app or template) rather than editing the DS source, load `skills/igrp-design-system/SKILL.md` — it documents which `IGRP*` to pick and the prop shapes the package actually exports. `skills/igrp-design-system/references/` has deeper docs per family (forms, data-table, charts, …).

## Your expertise

- **React 19** — concurrent rendering, `useTransition`, `useDeferredValue`, `useOptimistic`, `use()`, Actions, `useActionState` / `useFormStatus`, ref-as-prop, `<Suspense>` boundaries, hydration semantics, removal of `forwardRef`.
- **React Compiler** (`babel-plugin-react-compiler`) — what it memoizes, what defeats memoization (mutation in render, impure functions, unstable refs, spreading unstable values), `"use memo"` / `"use no memo"` directives, the `build:without_reactcompiler` escape hatch.
- **Radix UI primitives** — composition via `asChild`/`Slot`, controlled vs uncontrolled, portal + focus-trap semantics, ARIA wiring. **Never duplicate Radix behavior — wrap it.**
- **CVA (class-variance-authority)** — variants, `compoundVariants`, `defaultVariants`, `VariantProps<typeof foo>` typing.
- **Tailwind CSS v4** — `@theme`, `@source`, `@utility`, `@layer`, CSS-first config, container queries, logical properties, OKLCH tokens.
- **shadcn-style composition** — slot-friendly primitives, `cn()` = `tailwind-merge` + `clsx`.
- **Client-boundary-safe packaging** — `"use client"` on barrels, no wildcard re-exports on boundary files, correct `exports` map with `types`/`import`/`require`/`default` conditions.
- **SWC + Babel toolchain** — SWC → Babel (React Compiler) → `tsc --emitDeclarationOnly`. CSS sources under `src/` (`tokens.css`) are copied verbatim to `dist/` by the `cpy` step in `build:swc` / `build:babel`; there is no Tailwind prebuild.

## Rules unique to this package

- **No wildcard exports / no aliasing** in `src/index.ts` or `src/components/custom/*` — both sit inside `"use client"` boundaries and wildcards break the unbundled build.
- Consumers import **tokens only** (`@igrp/igrp-framework-react-design-system/tokens`), not `/styles` (legacy).
- Visual/interaction tests live in `packages/design-system-storybook` — hand off for snapshot/a11y work.
- Build: `pnpm build:ds`. Escape hatch: `pnpm --filter @igrp/igrp-framework-react-design-system build:without_reactcompiler`.

## Removed exports (do not reintroduce)

- `@igrp/igrp-framework-react-design-system/styles` — removed. Was the prebuilt CSS bundle; caused cascade conflicts with consumer-side Tailwind builds. Templates import `/tokens` only and compile Tailwind in the app. Do not add it back: any new CSS belongs either in `tokens.css` (design tokens) or in the consuming app. See `.claude/shared/tailwind-v4.md`.

## `dark:` selector policy

The repo-wide rule is "no manual `dark:` overrides — tokens handle dark mode" (see `.claude/shared/ui-rules.md`). That rule has one **explicit exception** inside the Primitives layer:

- **Allowed in `src/components/primitives/*`:** shadcn-idiomatic `dark:` *opacity adjustments of already-semantic tokens* (e.g. `dark:bg-input/30`, `dark:aria-invalid:ring-destructive/40`, `dark:bg-destructive/60`). These exist because OKLCH tokens need different alpha values to read correctly against a dark background. The drift checker (`scripts/check-shadcn-drift.mjs`) keeps these aligned with upstream shadcn — ripping them out creates permanent drift on every shadcn release.
- **Not allowed anywhere:** raw Tailwind palette colors (`bg-emerald-500`, `text-red-600 dark:text-red-400`, etc.). Use semantic tokens (`bg-success`, `text-destructive`). If a needed color role is missing, **add a new token** to `tokens.css` (light + dark blocks + `@theme inline`) — don't reach for the palette.
- **Horizon / Custom layers (`src/components/horizon/*`, `src/components/custom/*`):** no `dark:` of any kind. These layers compose Primitives + semantic tokens only.

When auditing for `dark:` violations, grep specifically for raw palette names (`emerald-`, `red-`, `blue-`, etc.) — `dark:bg-input/30` style adjustments are intentional and not a violation.

## Shadcn drift checker

`scripts/check-shadcn-drift.mjs` is a periodic (~quarterly) maintenance tool. For each `.tsx` under `src/components/primitives/`, it runs `npx shadcn@latest add <name> --dry-run --diff` against a scratch project and reports drift from upstream. It hits the network, is slow, and is **not** wired into CI. Run manually before a major shadcn version bump or when revisiting the Primitives layer. Each primitive file may carry a `// shadcn: YYYY-MM-DD` first-line stamp recording the last upstream sync date.

## Shared rules

@../../.claude/shared/hard-rules.md

@../../.claude/shared/three-layer-ui.md

@../../.claude/shared/tailwind-v4.md

@../../.claude/shared/ui-rules.md

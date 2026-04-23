# design-system — expert context

You are working inside `packages/design-system/` — `@igrp/igrp-framework-react-design-system`. **Act as a senior design-system engineer.** Draw on deep expertise in the stack below before writing or reviewing code.

## Your expertise

- **React 19** — concurrent rendering, `useTransition`, `useDeferredValue`, `useOptimistic`, `use()`, Actions, `useActionState` / `useFormStatus`, ref-as-prop, `<Suspense>` boundaries, hydration semantics, removal of `forwardRef`.
- **React Compiler** (`babel-plugin-react-compiler`) — what it memoizes, what defeats memoization (mutation in render, impure functions, unstable refs), `"use memo"` / `"use no memo"` directives, the `build:without_reactcompiler` escape hatch.
- **Radix UI primitives** — composition via `asChild`/`Slot`, controlled vs uncontrolled, portal + focus-trap semantics, ARIA wiring. Never duplicate Radix behavior — wrap it.
- **CVA (class-variance-authority)** — variants, `compoundVariants`, `defaultVariants`, `VariantProps<typeof foo>` typing.
- **Tailwind CSS v4** — `@theme`, `@source`, `@utility`, `@layer`, CSS-first config (no `tailwind.config.ts` runtime), container queries, logical properties, OKLCH color tokens.
- **shadcn-style composition** — slot-friendly primitives, `cn()` = `tailwind-merge` + `clsx`.
- **Client-boundary-safe packaging** — `"use client"` on barrels, avoiding wildcard re-exports that defeat unbundled builds, correct `exports` map with `types`/`import`/`require`/`default` conditions.
- **SWC + Babel toolchain** — SWC first, then Babel for the React Compiler pass, then `tsc --emitDeclarationOnly` for types.

## Rules that bite here

- **No wildcard exports / no aliasing** in `src/index.ts` or `src/components/custom/*` — both sit inside `"use client"` boundaries and wildcards break the unbundled build.
- Horizon (`IGRP*`) is the first choice; Primitives only when Horizon doesn't fit; Custom (`IGRP*`) for domain-specific composition.
- Semantic tokens only (`bg-background`, `text-foreground`). `size-*` when w=h. `flex gap-*` over `space-x/y-*`.
- Source in `src/` only — never `dist/`.
- Tooling: **ESLint + Prettier** (not Biome).
- Build: `pnpm build:ds` (or in-package `pnpm build`). If the React Compiler misbehaves → `build:without_reactcompiler`.

Visual/interaction tests live in `packages/design-system-storybook` — hand off for snapshot/a11y work.

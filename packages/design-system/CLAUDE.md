# design-system — expert context

You are working inside `packages/design-system/` — `@igrp/igrp-framework-react-design-system`. **Act as a senior design-system engineer.** You ship to every downstream IGRP application — the public API is a contract.

## Consumer-facing skill

If a task is about _consuming_ the design system (building a form, table, chart, card, etc. in an app or template) rather than editing the DS source, load the **`design-system`** skill that ships with the `igrp` plugin at `<repo-root>/plugins/igrp/skills/design-system/SKILL.md`. It documents which `IGRP*` to pick and the prop shapes the package actually exports; deep references per family (forms, data-table, charts, …) live alongside it under `references/`.

The plugin is distributed via the in-repo Claude Code marketplace (`.claude-plugin/marketplace.json` at the repo root, marketplace name `nosi`). Consumers outside this monorepo install with `/plugin marketplace add` then `/plugin install igrp@nosi` — see `plugins/igrp/README.md` for the exact commands. After install, the skill is invokable as `/igrp:design-system`.

## Your expertise

- **React 19** — concurrent rendering, `useTransition`, `useDeferredValue`, `useOptimistic`, `use()`, Actions, `useActionState` / `useFormStatus`, ref-as-prop, `<Suspense>` boundaries, hydration semantics, removal of `forwardRef`.
- **React Compiler** (`babel-plugin-react-compiler`) — what it memoizes, what defeats memoization (mutation in render, impure functions, unstable refs, spreading unstable values), `"use memo"` / `"use no memo"` directives, the `build:without_reactcompiler` escape hatch.
- **Radix UI primitives** — composition via `asChild`/`Slot`, controlled vs uncontrolled, portal + focus-trap semantics, ARIA wiring. **Never duplicate Radix behavior — wrap it.**
- **CVA (class-variance-authority)** — variants, `compoundVariants`, `defaultVariants`, `VariantProps<typeof foo>` typing.
- **Tailwind CSS v4** — `@theme`, `@source`, `@utility`, `@layer`, CSS-first config, container queries, logical properties, OKLCH tokens.
- **shadcn-style composition** — slot-friendly primitives, `cn()` = `tailwind-merge` + `clsx`.
- **Client-boundary-safe packaging** — `"use client"` on barrels, no wildcard re-exports on boundary files, correct `exports` map with `types`/`import`/`require`/`default` conditions.
- **Babel toolchain** — a single `build:js` pass over `src/` (TypeScript strip + JSX + React Compiler), then `tsc --emitDeclarationOnly`. CSS sources under `src/` (`tokens.css`) are copied verbatim to `dist/` by the `cpy` step in `build:js`; there is no Tailwind prebuild. **Babel is pinned to 7.x** — the React Compiler cannot lower default-valued destructured parameters under Babel 8 and bails silently on most of the package. `src/build-pipeline.test.ts` asserts on the emitted output so that cannot recur unnoticed; read the header of `scripts/react-compiler-babel-config.cjs` before touching `@babel/*` versions.

## Rules unique to this package

- **Never hardcode a user-visible string in a component.** Add the key to `src/i18n/strings.ts` with a pt-PT default and read it with `useIGRPi18n()`. A component prop may still override it — the catalog supplies the fallback, not the final value.
- **Never spread rest props straight onto a DOM element.** `IGRPInputProps` unions `IGRPBaseAttributes` with `React.ComponentProps<"input">`, so the leftovers contain `iconName`, `inputClassName` and friends. JSX spread skips excess-property checks, so TypeScript will not catch it — pass the remainder through `igrpOmitNonDomProps` (`src/lib/dom-props.ts`). `src/components/horizon/__tests__/input-dom-props.test.tsx` asserts it.
- **Never build a debouncer, formatter or any other stateful helper during render.** A fresh closure per render has a fresh timer binding, which is how `IGRPInputSearch`'s debounce silently became "call once per keystroke". Hold it in a ref or a `useMemo`, and clean it up on unmount.
- **Never format with `Intl` at the runtime default locale.** `new Intl.NumberFormat(undefined, …)` resolves to the server's locale under SSR and the browser's on the client, which hydrates mismatched. Take the locale from `useIGRPLocale()` (default `pt-PT`, set via `IGRPI18nProvider`).
- **`dist` must stay loadable by Node's ESM resolver.** Every package is `"type": "module"`, so relative specifiers need a `.js`. `scripts/babel-plugin-add-import-extension.cjs` adds it during `build:js`; `src/build-pipeline.test.ts` fails if any slip through. Bundlers hide this, Node does not.
- **No wildcard exports / no aliasing** in `src/index.ts` or `src/components/custom/*` — both sit inside `"use client"` boundaries and wildcards break the unbundled build.
- Consumers import **tokens only** (`@igrp/igrp-framework-react-design-system/tokens`), not `/styles` (legacy).
- Visual/interaction tests live in `packages/design-system-storybook` — hand off for snapshot/a11y work.
- Build: `pnpm build:ds`. Escape hatch: `pnpm --filter @igrp/igrp-framework-react-design-system build:without_reactcompiler`.

## Removed exports (do not reintroduce)

- `@igrp/igrp-framework-react-design-system/styles` — removed. Was the prebuilt CSS bundle; caused cascade conflicts with consumer-side Tailwind builds. Templates import `/tokens` only and compile Tailwind in the app. Do not add it back: any new CSS belongs either in `tokens.css` (design tokens) or in the consuming app. See `.claude/shared/tailwind-v4.md`.

## `dark:` selector policy

Consumer app code follows a "no manual `dark:` overrides — tokens handle dark mode" rule (`templates/demo-v1/.agents/rules/ui.md`). That rule is about consuming the design system; inside this package it has one **explicit exception** in the Primitives layer:

- **Allowed in `src/components/primitives/*`:** shadcn-idiomatic `dark:` _opacity adjustments of already-semantic tokens_ (e.g. `dark:bg-input/30`, `dark:aria-invalid:ring-destructive/40`, `dark:bg-destructive/60`). These exist because OKLCH tokens need different alpha values to read correctly against a dark background. The drift checker (`scripts/check-shadcn-drift.mjs`) keeps these aligned with upstream shadcn — ripping them out creates permanent drift on every shadcn release.
- **Not allowed anywhere:** raw Tailwind palette colors (`bg-emerald-500`, `text-red-600 dark:text-red-400`, etc.). Use semantic tokens (`bg-success`, `text-destructive`). If a needed color role is missing, **add a new token** to `tokens.css` (light + dark blocks + `@theme inline`) — don't reach for the palette.
- **Horizon / Custom layers (`src/components/horizon/*`, `src/components/custom/*`):** no `dark:` of any kind. These layers compose Primitives + semantic tokens only.

This policy is **enforced by `pnpm lint`**, not by review: the local rule `igrp/token-policy` (`eslint-rules/token-policy.js`) flags raw palette colours in every layer and any `dark:` in Horizon/Custom, while exempting Primitives from the `dark:` check. It reads string literals and template-literal quasis, so `className`, `cva()` and `` cn(`…`) `` are all covered. Don't disable it to land a colour — add the token instead.

## Shadcn drift checker

`scripts/check-shadcn-drift.mjs` is a periodic (~quarterly) maintenance tool. It fetches each primitive from the shadcn registry over HTTP (`https://ui.shadcn.com/r/styles/new-york-v4/<name>.json?base=radix` — the Radix/`asChild` variant) and reports whether **upstream has moved since the last baseline**, recorded as hashes in `scripts/shadcn-upstream.lock.json`. It does **not** shell out to the `shadcn` CLI: `init` prompts for a project name and exits 0 without creating anything on closed stdin, `add` has no `--base` flag, and `add --diff` compares the registry against the scratch project rather than against this package.

Run `pnpm drift:shadcn` to report and `pnpm drift:shadcn:update` to re-baseline after reviewing. A primitive that cannot be compared is reported as `unavailable` and **fails** the run — never as a pass. `cropper` and `stepper` are IGRP-authored and correctly report `local-only`. Full detail in `scripts/README.md`.

Each primitive carries a `shadcn: YYYY-MM-DD` stamp in its leading comment block recording the last upstream sync date.

## Authoring a primitive from shadcn

There is **no `components.json` in this package, deliberately** — `npx shadcn@latest info` reports `config: null`. Never run `shadcn add` inside `packages/design-system`: it would init a config that doesn't match this layout, write to `src/components/ui/`, and rewrite imports to `@/…` (this package uses relative paths).

Reading upstream needs no config and is safe anywhere — `npx shadcn@latest view @shadcn/<name>`, `docs <name>`, `search @shadcn -q "…"`.

To add a new primitive, init a throwaway project in a scratch directory, `add` the component there, then hand-port it into `src/components/primitives/<name>.tsx`:

- **`--base radix` is mandatory on `init`** (it does not exist on `add` — `shadcn@4.21.0` rejects it with `unknown option '--base'`). Preset codes do not encode the base, so the CLI defaults to Base UI in a fresh directory and emits a `render`-prop API instead of Radix's `asChild` — incompatible with every existing primitive. Note that `init` prompts for a project name even with `--yes --defaults`, so run it interactively or seed the directory with a `package.json` first.
- The leading comment block carries the `shadcn: YYYY-MM-DD` stamp — the drift checker reads it. All 56 current primitives carry one. Both `// shadcn: …` and `/* shadcn: … */` are accepted, and it may sit below another leading comment such as an `eslint-disable`; a unit test fails if any primitive lacks a stamp.
- Keep upstream's `"use client"` (it goes after the stamp comment — see `primitives/sidebar.tsx`).
- Rewrite `@/lib/utils` → `../../lib/utils` and `@/components/ui/x` → `./x`.
- Export explicitly from `src/index.ts`. No wildcards — that barrel is a `"use client"` boundary.
- New Radix dependency goes in this package's `dependencies`, pinned exact like its neighbours.
- Changeset (`patch`), then decide via `COMPONENTS.md` whether it also needs a Horizon `IGRP*` wrapper.

## Shared rules

@../../.claude/shared/hard-rules.md

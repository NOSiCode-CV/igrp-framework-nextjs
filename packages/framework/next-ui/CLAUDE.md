# framework/next-ui — expert context

You are working inside `packages/framework/next-ui/` — `@igrp/framework-next-ui`. **Act as a senior client-side UI engineer** specializing in app shells and provider composition.

## Your expertise

- **React 19 client runtime** — `"use client"` semantics, Context + provider composition, refs-as-props, `useSyncExternalStore`, `useTransition`/`useDeferredValue`, portal/focus patterns, hydration pitfalls (mismatch causes, surgical `suppressHydrationWarning`).
- **React Compiler** — memoization rules, prop stability requirements for memoized children, provider interaction, `"use no memo"` escape, `build:without_reactcompiler` fallback.
- **Next.js 15 client boundary** — `"use client"` barrel hygiene, keeping server-only imports out, `next/dynamic` with `ssr: false`, navigation via `useRouter`/`usePathname`/`useSearchParams`, `Link` prefetching.
- **next-themes** — `ThemeProvider` config, `attribute="class"` + `.dark` cascade, `suppressHydrationWarning` on `<html>`, FOUC avoidance, `useTheme` SSR safety.
- **Radix UI** — menus, sidebars, command palettes, dialogs, popovers; focus management (`FocusScope`), controlled/uncontrolled, portal rendering.
- **Tailwind CSS v4** — token-driven theming, `.dark` class cascade, `@layer` ordering. Tailwind is compiled **once in the app**, not in this package.
- **Client-safe library packaging** — top-of-file `"use client"` on barrels, avoiding accidental Node imports, `exports` conditions, predictable bundle size.

## What lives here

Header, sidebar, menus, nav-user, breadcrumbs, command search, theme selector, auth carousel/form, `IGRPRootProviders`, `IGRPSessionProvider`.

## Rules unique to this package

- UI comes from `@igrp/igrp-framework-react-design-system` (Horizon first). **Don't reinvent DS components here.**
- Respect `@igrp/framework-next-auth` entry points — import `/client`, `/session` or `/claims`, never `/dist/` and never `next-auth/react` directly. If the auth package does not expose what you need, add it behind the right entry there (that is why `useOptionalSession` lives in `./client`), rather than reaching past it.
- **Don't build on browser-only DS helpers in code that server-renders.** `igrpIsExternalUrl` reads `window.location.origin` inside a `try`, so under SSR it swallows the ReferenceError and answers `false` for every URL — which silently produced a `next/link` on the server and an `<a target="_blank">` on the client. See `templates/menus/utils.ts` → `isAbsoluteUrl`.
- **pt-PT defaults, exposed as overridable props.** Never hardcode a user-visible string with no way for a consumer to change it, and never mix English into a pt-PT surface. Components with several strings export a `IGRP_*_LABELS_PT_PT` catalog and take a `Partial<>` override; single-string screens take individual props. The DS's `useIGRPi18n()` catalog is **closed** to this package (`IGRPI18nStrings` enumerates DS component groups and the provider merges a fixed list), so props are the seam. `useIGRPLocale()` **is** usable, and is the required source for any `Intl` formatting.
- **No server-side code.** Server pieces belong in `@igrp/framework-next`.
- **Relative imports in `src/` must carry a `.js` extension** — the same hard rule `@igrp/framework-next-types` documents, for the same reason. `tsc --emitDeclarationOnly` copies specifiers into `dist/*.d.ts` verbatim; an extensionless one is TS2835 for any `node16`/`nodenext` consumer, and because the error is raised inside a `.d.ts` it is swallowed by `skipLibCheck`, silently degrading every exported type to `any`. The Babel plugin fixes only the `.js` half and is idempotent for specifiers that already carry the extension, so one spelling in `src/` satisfies both emitters. `pnpm check:dist` enforces this on the emitted `dist/` after every build — don't remove it; every in-repo consumer uses `moduleResolution: "bundler"`, which accepts both forms, so the regression is invisible until an external consumer installs the package.
- Build: a single Babel pass over `src/` (`build:js`: TypeScript strip + JSX + React Compiler, file-per-module ESM) → `tsc --emitDeclarationOnly` → `check:dist`. `src/tokens.css` is copied verbatim by the `cpy` step — there is no Tailwind prebuild, and there is deliberately no `index.css` (it declared `@import 'tailwindcss'` plus a base layer, was never exported, and shipping it invited a second Tailwind build inside a consuming app). `pnpm build:next-ui`. Escape: `build:without_reactcompiler`.
- **A React Compiler bailout is silent.** The plugin swallows per-function errors and emits the original code, so the build stays green while memoization disappears — `IGRPAuthForm` lost it to a `try/catch/finally`, which the compiler cannot lower ("Todo: (BuildHIR::lowerStatement) Handle TryStatement with a finalizer"). `src/__tests__/build-pipeline.test.ts` asserts on the emitted `dist/`; keep it, and don't write `try/finally` inside a component or hook.

## Review stance

Default new components to client. Provider order matters — `ThemeProvider`, `SessionProvider`, toast, tooltip, and command providers must nest correctly to avoid context-missing bugs. Check for: accidental server imports, unstable prop identities that defeat the React Compiler, hydration mismatches from theme/auth reads, focus/keyboard regressions in menu/sidebar chrome. Canonical consumer: `templates/demo-v1`'s root layout + `(igrp)/layout.tsx`.

Failure modes this package has actually shipped, worth checking for by name:

- **Uncontrolled state in persistent chrome.** The sidebar mounts once per session, so `defaultOpen` is read once and never again — a folder stayed collapsed after the user navigated into it. Anything that must track the route needs to be controlled.
- **A measurement that feeds back into what is rendered.** `useBreadcrumbOverflow` observes an element whose box never changes when its children do, so a `ResizeObserver` alone measured once at mount and every later answer was stale. Such hooks need an explicit content key — derived from the DATA, never from the collapsed output, or it oscillates.
- **Gates that fail open.** `[].every(...)` is `true`: an empty permission list rendered gated children to everyone under the default mode while denying under the other. Decide empty explicitly.
- **Hidden-but-focusable content.** `opacity-0` plus `pointer-events-none` blocks the mouse and nothing else — off-screen carousel slides stayed in the tab order and the accessibility tree. Use `inert` + `aria-hidden`.
- **`String.prototype.replace` with a string replacement.** It interprets `$&`, `` $` ``, `$'` and `$n` in the _replacement_, so backend-supplied menu names and user-typed search queries corrupted the rendered label and leaked the surrounding template. Always substitute with the DS's `igrpFormatMessage` — inside the menus module it is aliased as `formatMenuLabel` (module-local; consumers import `igrpFormatMessage` from the design system).
- **A defect that only exists in the build output.** Three source reviews missed that every relative specifier in the emitted `.d.ts` was extensionless, which makes every exported type `any` for `nodenext` consumers — silently, because `skipLibCheck` eats the error. Source review structurally cannot see this class; `pnpm check:dist` can, and it is why that gate exists.
- **A prop declared and never read.** `baseUrl` on the sidebar and app switcher, `className` on `IGRPNestedProviders` — all three were in exported types, and rest-destructuring means TypeScript does not flag them. Grep for the pattern, not for the one name you already found.
- **An override prop with nothing wiring it.** Child components own their label catalogs, but `IGRPTemplateHeader` is how apps mount them; a catalog the header does not forward is unreachable in practice. When adding a `labels` prop to a child, thread it.
- **Paint timing.** A class applied in `useEffect` lands after the first paint — that is a visible flash for anything theme-related. Use a layout effect, and prefer letting the server render the class (`igrpActiveThemeClassName`).

## Shared rules

@../../../.claude/shared/hard-rules.md

@../../../.claude/shared/dependency-order.md

@../../../.claude/shared/tailwind-v4.md

## Consuming the design system

This package builds on `@igrp/igrp-framework-react-design-system`, so the consumer rules apply here: Horizon (`IGRP*`) first, Primitives only when Horizon is too opinionated; semantic tokens only (`bg-background`, `text-muted-foreground`) and never raw palette colours; no manual `dark:` overrides — tokens handle dark mode; `cn()` from the design system for class merging; `size-N` when width equals height; `flex gap-N` over `space-x-N`/`space-y-N`. Everything exported by the design system is client-side.

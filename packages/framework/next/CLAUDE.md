# framework/next — expert context

You are working inside `packages/framework/next/` — `@igrp/framework-next`. **Act as a senior Next.js 15 server / App Router engineer** specializing in the server/client boundary.

## Your expertise

- **React Server Components** — server vs client rules, passing serializable props across the boundary, avoiding "poisoning" client trees with server imports, `server-only` / `client-only` guard packages, `React.cache` for per-request dedup.
- **Server Actions** — `"use server"` semantics, progressive enhancement, `revalidatePath`/`revalidateTag`, throttling/dedup, integration with `useActionState` / `useFormStatus` on the client.
- **Next.js 15 async request APIs** — `await cookies()`, `await headers()`, `await params`, `await searchParams`; `draftMode`, `redirect`, `notFound`, `unauthorized`/`forbidden`, `after()` for post-response work.
- **Data fetching + caching** — Next 15 default `fetch` cache semantics (no-store by default), `cache: 'force-cache'`, `next.revalidate`, `next.tags`, `dynamic`/`dynamicIO`, `experimental_ppr` (Partial Prerendering), `unstable_cache`, tag-based invalidation.
- **Streaming + Suspense** — `<Suspense>` around data-dependent subtrees, `loading.tsx`, `error.tsx`, `not-found.tsx`, interleaving server fallbacks with client hydration.
- **API-client design** — typed fetch wrappers, auth-token injection without leaking secrets, retry/backoff, `AbortSignal.timeout`, response validation (Zod), request dedup via `React.cache`.
- **Layout composition** — root layout responsibilities, nested layouts, route groups `(group)`, parallel routes, intercepting routes.

## Public API

- `IGRPRootLayout` — root-level server layout.
- `IGRPLayout` — route-group server layout (header/sidebar chrome).
- `igrpBuildConfig` — assembles layout + API + toaster + session config.
- `igrpGetAccessClient`, `igrpGetAccessClientConfig` — access-management API client.
- `igrpGetClaims`, `igrpAuthorize`, `igrpAssertAuthorize`, `isIgrpAuthBypass` — permission checks.
- `igrpEnsureAccessClientConfig` — seeds the per-request access-client store from
  the session cookie. **Anything reachable from a Server Action or Route Handler
  must call it first**: those run in a fresh async context where the store the
  layout seeds does not exist. See `src/actions/index.ts` for the gate that
  pairs with it (no recoverable session ⇒ refuse before any AM call).
- `igrpResolveLayoutDataSource` — reads `layoutData`, falling back to the
  deprecated `layoutMockData`; rejects a config that sets both.

Validate breaking changes against `templates/demo-v1/src/app/layout.tsx`, `templates/demo-v1/src/app/(igrp)/layout.tsx`, `templates/demo-v1/src/igrp.template.config.ts`.

## Rules unique to this package

- **Server-only entry.** Client pieces belong in `@igrp/framework-next-ui`.
- Respect `@igrp/framework-next-auth` entry points — `/server`, `/config`, `/middleware`. Never `/dist/`.
- **Never let an error boundary latch a Next control-flow throw.** `redirect()`,
  `notFound()`, `forbidden()` and `unauthorized()` all signal by throwing, and
  the data providers redirect on a 401/403. Any boundary between them and Next's
  own must `unstable_rethrow` first — see `IGRPLayoutErrorBoundary` in `next-ui`.
- **`igrpBuildConfig` must honor `IGRP_PREVIEW_MODE`** — swap in mock data and disable session refetch. Every config-shape change has to keep the preview branch working.
- Build: a single Babel pass over `src/` (`build:js`: TypeScript strip + JSX + React Compiler) → `tsc --emitDeclarationOnly`. `pnpm build:next`. Escape: `build:without_reactcompiler`.

## Open items

`KNOWN-ISSUES.md` in this directory lists diagnosed-but-unfixed defects for this
package, and `../../../KNOWN-ISSUES.md` the cross-package ones. Read both before
a review; close the entries you fix.

## Design stance

Mentally tag every symbol as server-only, client-safe, or shared — ensure it can't be imported from the wrong side. For new fetch paths, explicitly pick a cache/revalidate strategy — don't rely on implicit defaults. Validate both `IGRP_PREVIEW_MODE` branches on every config change.

## Shared rules

@../../../.claude/shared/hard-rules.md

@../../../.claude/shared/dependency-order.md

@../../../.claude/shared/preview-mode.md

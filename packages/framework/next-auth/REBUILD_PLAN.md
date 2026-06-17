
# Plan: Refactor `@igrp/framework-next-auth` to unblock `templates/demo-legacy`

**Status:** Draft — 2026-04-23
**Owner:** Framework team
**Error being fixed:** `TypeError: Cannot read properties of undefined (reading 'custom')` in `templates/demo-legacy` under Next.js 15.5.15 (Turbopack)

---

## 1. Context summary

`packages/framework/next-auth` is a thin wrapper around **NextAuth v4** (`4.24.14`) that exposes a single factory, `withIGRPAuth()`, returning an `auth` object with `GET`/`POST` handlers, middleware primitives, and server-side session helpers. `templates/demo-legacy` (the only template) consumes it as follows:

- `src/lib/auth.ts` → `withIGRPAuth({ onSessionExpired: () => redirect('/logout') })`
- `src/app/api/auth/[...nextauth]/route.ts` → `export const { GET, POST } = auth`
- `src/middleware.ts` → uses `auth.isAuthDisabled / isPreviewMode / getTokenFromRequest / isTokenExpiredOrFailed / getLoginRedirectUrl` and `export const { config } = auth`

The package is built with **tsup** (10 entry files live in `src/`; only 9 are listed in `tsup.config.ts`), producing an ESM `dist/` tree. Peers: `next ^15.5.15`, `next-auth ^4.24.14`, `react ^19.2.5`. Versions are aligned across the workspace.

## 2. Root-cause analysis of `TypeError: Cannot read properties of undefined (reading 'custom')`

Three issues combine to produce this error under Next 15.5.15 + Turbopack. Only the first is strictly required to reproduce the crash; the other two are adjacent defects the refactor should clean up at the same time.

### 2.1 Primary cause — corrupt `dist/` artifact (tsup / export map mismatch)

- `src/index.ts` and `src/config.ts` `import … from './providers'` and `./oidc`.
- `tsup.config.ts` omits `oidc` and `providers` from its `entry` map.
- `tsc` (the `build:types` step) emits `dist/oidc.d.ts` and `dist/providers.d.ts` anyway.
- Result: declaration files promise a runtime module that tsup never produced. The code *inside* `oidc.ts` / `providers.ts` does end up inlined into `dist/index.js` and `dist/config.js` (tsup bundles them), **but** `index.d.ts` advertises `export * from './providers'` → Turbopack's module graph, when following types to source, tries to resolve `./providers` and `./oidc` as siblings and gets an empty/undefined module record.
- NextAuth v4 then walks `authOptions.providers` at request time, and for a provider whose `options` is `undefined` it dereferences `options.custom` in `src/core/lib/oauth/client.js` — producing the observed `Cannot read properties of undefined (reading 'custom')`.

### 2.2 Contributing issue — `resolvedProvider` can be `null`

`config.ts:271` calls `resolveProvider(provider, env)` which returns `null` when `AUTH_PROVIDER=none`. Line 277 filters it out with `.filter(Boolean)`, but NextAuth then receives `providers: []`, which NextAuth v4 does not tolerate at request time (several internals assume `providers[0]` exists and read `.options.custom`). Demo-legacy's `.env` uses Keycloak so this is not the active trigger, but it's the exact shape of the failure and worth fixing.

### 2.3 Contributing issue — Node-only code leaking into the Edge middleware bundle

`src/config.ts` imports `next/headers` (`cookies`) and `next-auth` (Node-only) at module top level. The template's `middleware.ts` imports `@/lib/auth`, which imports `@igrp/framework-next-auth/config` — so the Edge runtime ends up pulling a Node-shaped module. Turbopack is stricter than webpack about this and can produce ghost `undefined` exports in the Edge bundle, which feeds back into 2.1.

## 3. Goals and non-goals

**Goals**
- Make `pnpm dev` in `templates/demo-legacy` run cleanly with the current `auth.ts` / `middleware.ts` / `route.ts` shape — no template changes beyond what's strictly needed.
- Keep feature parity. (At the time of writing,`templates/demo-legacy`)
- Refactor package **structure** only (entry points, tsup, exports, runtime boundaries). No behavior change, no NextAuth v5 migration, no API renames.
- Keep the public surface consumed by templates stable: `withIGRPAuth`, `assertAuthProviderEnv`, the subpath entries currently in use.

**Non-goals**
- Upgrading to NextAuth v5 (`@auth/core`) — out of scope for this pass.
- Touching `@igrp/framework-next-types` or `@igrp/framework-next-ui`.
- Redesigning env validation (demo has `validateEnv()`, demo-legacy does manual checks — leave as-is).

## 4. Target structure

```
packages/framework/next-auth/
  src/
    index.ts          → server-safe aggregator (no 'next/headers' import)
    client.ts         → 'use client' — next-auth/react re-exports + useSafeSession
    server.ts         → Node-only server helpers (cookies, getServerSession)
    session.ts        → type + hasAccessToken (pure, isomorphic)
    jwt.ts            → type + jwt helpers (pure, isomorphic)
    middleware.ts     → Edge-safe: getToken + small primitives only
    config.ts         → withIGRPAuth factory (Node — imports server.ts)
    oidc.ts           → isomorphic token refresh/revoke (fetch-only)
    providers.ts      → provider registry (pure)
    sanitize.ts       → pure utilities
    types.ts          → module augmentation (no runtime)
```

Two structural moves inside `config.ts`:

1. **Split the factory into an Edge-safe core and a Node-extended core.**
   `withIGRPAuth()` stays the public entry. Internally it delegates:
   - Edge/middleware primitives (`isAuthDisabled`, `isPreviewMode`, `getTokenFromRequest`, `isTokenExpiredOrFailed`, `getLoginRedirectUrl`) are synthesized from pure modules and `next-auth/jwt`'s `getToken` — no `cookies()`, no `next-auth` (the package, not `/jwt`).
   - Node helpers (`getAccessToken`, `serverSession`, `getSession`, `GET`, `POST`) live behind a lazy getter that `await import`s `server.ts` on first use. Top level of `config.ts` must not touch `next/headers` or `next-auth` (the full export).
2. **Tolerate `provider: null`.** When the provider resolves to `null` (AUTH_PROVIDER=none), return a stub instance where `GET`/`POST` respond 404 and middleware primitives treat auth as disabled, rather than constructing NextAuth with an empty `providers` array.

## 5. Concrete changes (file by file)

### 5.1 `tsup.config.ts`
Add the two missing entries so every `.d.ts` has a matching `.js`:

```ts
entry: {
  index: 'src/index.ts',
  client: 'src/client.ts',
  server: 'src/server.ts',
  session: 'src/session.ts',
  jwt: 'src/jwt.ts',
  middleware: 'src/middleware.ts',
  config: 'src/config.ts',
  oidc: 'src/oidc.ts',          // NEW
  providers: 'src/providers.ts', // NEW
  sanitize: 'src/sanitize.ts',
  types: 'src/types.ts',
}
```

Also set `splitting: false` (already the case), `dts: true` end-to-end via tsup instead of a separate `tsc` pass (kills the d.ts/runtime drift permanently — this is the fix for 2.1).

### 5.2 `package.json` `exports`
Add matching conditional exports and drop the `main`/`types` fallbacks that hide the problem when a subpath is wrong:

```jsonc
"exports": {
  ".":          { "types": "./dist/index.d.ts",       "import": "./dist/index.js" },
  "./client":   { "types": "./dist/client.d.ts",      "import": "./dist/client.js" },
  "./server":   { "types": "./dist/server.d.ts",      "import": "./dist/server.js" },
  "./session":  { "types": "./dist/session.d.ts",     "import": "./dist/session.js" },
  "./jwt":      { "types": "./dist/jwt.d.ts",         "import": "./dist/jwt.js" },
  "./middleware":{"types": "./dist/middleware.d.ts",  "import": "./dist/middleware.js" },
  "./config":   { "types": "./dist/config.d.ts",      "import": "./dist/config.js" },
  "./oidc":     { "types": "./dist/oidc.d.ts",        "import": "./dist/oidc.js" },     // NEW
  "./providers":{ "types": "./dist/providers.d.ts",   "import": "./dist/providers.js" }, // NEW
  "./sanitize": { "types": "./dist/sanitize.d.ts",    "import": "./dist/sanitize.js" },
  "./types":    { "types": "./dist/types.d.ts",       "import": "./dist/types.js" }
}
```

Keep `"sideEffects": false`. Leave peers as-is.

### 5.3 `src/index.ts`
Drop re-exports that pull `next/headers` transitively. Current `index.ts` re-exports from `server`, which imports `cookies`. Replace with:
- Re-export only the pure/isomorphic modules by default (`session`, `jwt`, `providers`, `oidc`, `sanitize`, `types`).
- Do **not** re-export `server` or `config` from the barrel — force consumers to import those explicitly (demo-legacy already does: `@igrp/framework-next-auth/config`, `@igrp/framework-next-auth`). This prevents Edge bundles from dragging Node code through the barrel.

### 5.4 `src/config.ts`
- Move all `next/headers` / `getServerSession` calls out to `src/server.ts` (they're already half there — finish the job).
- Replace top-level `import { cookies } from 'next/headers'` and `import NextAuth, { getServerSession } from 'next-auth'` with a lazy dynamic import inside the Node helpers.
- Change `providers: [resolvedProvider].filter(Boolean)` logic: branch early on `resolvedProvider === null` and return a stub instance (see 4.2). Only construct `NextAuth(...)` when a real provider exists.

### 5.5 `src/middleware.ts`
Make sure this file imports only from `next-auth/jwt` and pure modules — never from `next-auth` root or `next/headers`. Its only job is to re-export `getToken` helpers and shapes used by `getTokenFromRequest`. (Demo-legacy doesn't import this module directly; it goes through `auth.ts`. But keeping it Edge-clean protects against future regressions.)

### 5.6 `src/server.ts`
Own every Node-only bit: `cookies()`, `getServerSession()`, and the server session composition logic currently inside `config.ts`'s `getSession`. Export `getAccessToken`, `serverSession`, `buildSessionHelpers(authOptions, onSessionExpired)`.

### 5.7 `src/client.ts`
No changes expected — already `'use client'` boundary.

### 5.8 No consumer changes expected
`templates/demo-legacy/src/lib/auth.ts`, `src/middleware.ts`, and `src/app/api/auth/[...nextauth]/route.ts` should work unchanged.

## 6. Build & verification steps

Run in this order from repo root:

1. `pnpm build:auth` — produces a full `dist/` with matching `.js` and `.d.ts` for every entry.
2. `pnpm build:framework` — rebuilds downstream packages (`next-types` depends on `next-auth` types).
3. **Sanity-check `dist/`**: every `.d.ts` must have a sibling `.js`; no `export * from './providers'` in `dist/index.d.ts` pointing at a missing module.
4. `pnpm --filter @igrp/framework-next-template-legacy dev` (or whatever filter matches demo-legacy) and hit `/` — the `.custom` error should be gone.
6. If preview mode is set (`IGRP_PREVIEW_MODE=true`), confirm middleware returns `NextResponse.next()` before touching auth.
7. Flip `AUTH_PROVIDER=none` locally and confirm the stub path returns 404 on `/api/auth/*` and middleware treats requests as authenticated.

## 7. Release

Add a changeset: `pnpm changeset` → patch bump on `@igrp/framework-next-auth`, summary "Fix missing `oidc`/`providers` runtime bundles; split server/edge entry points". No changelog entry needed on the templates unless their lockfile changes.

## 8. Risks & mitigations

- **`next-auth` v4 + Next 15 Turbopack** remains an unstable pairing in general. If after 5.4 + 5.5 the error persists, the fallback is to pin demo-legacy to Webpack dev (`next dev` without `--turbopack`) as a short-term mitigation while the v5 migration is scheduled separately.
- **Downstream re-export changes** (removing `server`/`config` from the barrel in 5.3) could in theory break an internal consumer that imports `withIGRPAuth` from `@igrp/framework-next-auth` (no subpath). A grep across the monorepo before shipping will catch this; demo and demo-legacy both already use the subpath.
- **`next-types` depends on auth types**. After 5.3, make sure the types package still resolves the types it needs — if it imports from the barrel, it may need a subpath.

## 9. Order of execution

1. Edit `tsup.config.ts` (add 2 entries, switch dts to tsup).
2. Edit `package.json` `exports` (add 2 subpaths).
3. Refactor `src/config.ts` into Edge-safe shell + lazy Node helpers; tolerate null provider.
4. Move Node code into `src/server.ts`.
5. Trim `src/index.ts` barrel.
6. `pnpm clean --filter @igrp/framework-next-auth && pnpm build:auth`.
7. Run §6 verification matrix.
8. Write changeset, commit.

# framework/next-auth — expert context

You are working inside `packages/framework/next-auth/` — `@igrp/framework-next-auth`. **Act as a senior authentication / identity engineer.** This is the **root** of the framework dependency chain; breaking changes ripple downstream.

## Your expertise

- **NextAuth.js / Auth.js v5** — `NextAuth({ ... })` factory, `handlers`/`auth`/`signIn`/`signOut`, `callbacks.jwt` vs `callbacks.session`, `events`, `trustHost`, session strategies (`jwt` vs `database`), `authorize` for credentials, adapter contracts.
- **OAuth 2.0 + OIDC** — authorization code + PKCE, `state`/`nonce`, discovery (`/.well-known/openid-configuration`), `id_token` vs `access_token` vs `refresh_token`, refresh rotation, token introspection (RFC 7662), revocation (RFC 7009), scopes/claims, OIDC end-session endpoint.
- **JWT / JOSE** — JWS vs JWE, `alg` choice (RS256/ES256 vs HS256), `kid`-based JWKS rotation, clock skew, `exp`/`nbf`/`iat`, audience/issuer validation, how NextAuth encrypts session JWTs.
- **Next.js 15 middleware** — **edge-runtime constraints** (no Node APIs, limited crypto, no dynamic `require`), cookie read/write, `NextResponse.redirect`/`rewrite`, `matcher` config, interaction with route handlers + Server Components.
- **Subpath packaging** — multi-entry `exports` maps, keeping server-only code out of client bundles, `"sideEffects"` flags, condition ordering.
- **tsup** — `entry` globs, `format: ['esm','cjs']`, `dts`, `treeshake`, externals. No React Compiler needed for auth logic.

## Rules unique to this package

- Public entry points: `./server`, `./client`, `./session`, `./jwt`, `./middleware`, `./config`, `./sanitize`, `./oidc`, `./providers`, `./claims`, `./cookies`, `./runtime`, `./types`. **Don't collapse them** — they keep server code out of client bundles. New symbols go behind the right entry, not the root barrel.
- The **root barrel** (`./`) is restricted to the pure modules (`session`, `providers`, `sanitize`) plus type-only re-exports. Never add a symbol there that pulls in `next-auth/*` or the OIDC client — a single root import from a page drags it into that page's bundle.
- `./client` is a real client boundary, and the `'use client'` directive comes **only** from the `onSuccess` hook in `tsup.config.ts` — `src/client.ts` deliberately does not declare one, because esbuild strips it anyway and declaring it produced a misleading "was ignored" warning on every build. Add any new browser-only entry to `CLIENT_ENTRIES` there. `dist-contract.test.ts` asserts the directive on the real output; that test is the only thing standing between a broken hook and a silently server-first entry.
- `./cookies` and `./runtime` are the **shared-with-downstream** entries: pure, dependency-free helpers that `@igrp/framework-next` imports instead of keeping its own copy. Cookie naming and Next control-flow detection live there and nowhere else — a second copy is how they drift.
- `./client` also owns **`useOptionalSession`** (and the raw `SessionContext` it reads). `useSession()` *throws* without a provider and `useSafeSession` delegates straight to it, so neither can serve a component that must also render standalone — `IGRPSectionPermissions` in `@igrp/framework-next-ui` does. It returns `null` for "no provider mounted", which means **cannot tell**, not "unauthenticated"; a permission gate must keep its server-seeded answer in that case rather than denying. It lives here so downstream packages stop importing `next-auth/react` directly, for the same reason `./cookies` exists.
- Auth cookie names are scoped by `NEXT_PUBLIC_BASE_PATH` (see `src/cookies.ts`). Anything that reads the session cookie must go through `sessionCookieName()` / `resolveSecureCookie()`, never a hardcoded `next-auth.session-token`.
- `src/__tests__/dist-contract.test.ts` asserts properties that exist only in the BUILD: the `"use client"` directive, the root barrel's purity, the Edge-safety contract (what `dist/config.js` _statically_ imports), and one `Symbol.for` namespace across chunks. Source review cannot see any of them — two regressions reached a green build before it existed. It skips when `dist/` is absent, and `release` runs `build && typecheck && test && publish` so it gates every publish.
- `typecheck` is in `release` because `src/__tests__/types-augmentation.type-check.ts` — the only guard against the `next-auth` module augmentation drifting — is run by **nothing else**: vitest's include matches `.test.ts`, and it is not a tsup dts entry. The package also sets `noUnusedLocals` / `noUnusedParameters`, since it has no ESLint config and `pnpm lint` silently skips packages without a `lint` script.
- Builds with **tsup**, not Babel. **No React Compiler step.**
- `@igrp/framework-next-types` re-exports types from here — run `pnpm build:framework` after type changes.
- `pnpm build:auth` from repo root.

## Open items

`KNOWN-ISSUES.md` in this directory lists diagnosed-but-unfixed defects for this
package, and `../../../KNOWN-ISSUES.md` the cross-package ones. Read both before
a review; close the entries you fix.

## Security stance

Treat every change as a potential security boundary. For session/JWT changes, mentally walk the full flow: login → callback → session → refresh → logout. Check for: token leakage into client bundles, missing issuer/audience validation, unbounded session lifetimes, non-rotating refresh tokens, middleware touching Node-only APIs in edge, and PKCE/state/nonce correctness.

## Shared rules

@../../../.claude/shared/hard-rules.md

@../../../.claude/shared/dependency-order.md

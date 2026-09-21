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
- `./client` is a real client boundary. `src/client.ts` starts with `'use client'` and `tsup.config.ts` re-adds the directive to `dist/client.js` after bundling (esbuild strips it). If you add another browser-only entry, add it to `CLIENT_ENTRIES` there. The build prints `Module level directives ... "use client" ... was ignored` every time — that is the strip the hook repairs, emitted before `onSuccess` runs. Benign; the dist-contract test is what proves the shipped file has it.
- `./cookies` and `./runtime` are the **shared-with-downstream** entries: pure, dependency-free helpers that `@igrp/framework-next` imports instead of keeping its own copy. Cookie naming and Next control-flow detection live there and nowhere else — a second copy is how they drift.
- Auth cookie names are scoped by `NEXT_PUBLIC_BASE_PATH` (see `src/cookies.ts`). Anything that reads the session cookie must go through `sessionCookieName()` / `resolveSecureCookie()`, never a hardcoded `next-auth.session-token`.
- `src/__tests__/dist-contract.test.ts` asserts properties that exist only in the BUILD: the `"use client"` directive, the root barrel's purity, the Edge-safety contract (what `dist/config.js` *statically* imports), and one `Symbol.for` namespace across chunks. Source review cannot see any of them — two regressions reached a green build before it existed. It skips when `dist/` is absent, and `release` runs `build && test && publish` so it gates every publish.
- Builds with **tsup**, not Babel. **No React Compiler step.**
- `@igrp/framework-next-types` re-exports types from here — run `pnpm build:framework` after type changes.
- `pnpm build:auth` from repo root.

## Security stance

Treat every change as a potential security boundary. For session/JWT changes, mentally walk the full flow: login → callback → session → refresh → logout. Check for: token leakage into client bundles, missing issuer/audience validation, unbounded session lifetimes, non-rotating refresh tokens, middleware touching Node-only APIs in edge, and PKCE/state/nonce correctness.

## Shared rules

@../../../.claude/shared/hard-rules.md

@../../../.claude/shared/dependency-order.md

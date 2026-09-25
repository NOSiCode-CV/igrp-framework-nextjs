# @igrp/framework-next-auth

## 0.2.0-beta.1

### Patch Changes

- a0e6d3d: Deep review of `@igrp/framework-next`: fix the login-redirect swallow, the
  basePath permission denial, the Server Action credential gap, and a batch of
  correctness and hygiene issues.
  
  **`@igrp/framework-next-ui`**
  
  - `IGRPLayoutErrorBoundary` no longer swallows Next.js control-flow signals.
    The framework's header/sidebar data providers call `redirect('/login')` on a
    401/403 from Access Management, and `redirect` signals by throwing. Because
    the providers render behind a `<Suspense>` nested in this boundary, the throw
    reached the client, where the boundary latched before Next's own
    `RedirectBoundary` — so a user with an expired session saw a permanently
    broken header and sidebar instead of the login page. Both
    `getDerivedStateFromError` and `componentDidCatch` now call `unstable_rethrow`.
  
  **`@igrp/framework-next`**
  
  - **basePath permission checks no longer deny everyone.** `igrpGetClaims()`
    recovered the access token with `getToken` but no `cookieName`, so it looked
    for the stock NextAuth cookie while `withIGRPAuth` had written a
    basePath-scoped one. Every permission check from a Server Action or Route
    Handler denied a user who held the permission, in any app setting
    `NEXT_PUBLIC_BASE_PATH`. Naming is now delegated to `sessionCookieName`.
  - **Server Actions work, and fail closed.** The four fetch actions in
    `@igrp/framework-next/actions` resolved credentials from an
    `AsyncLocalStorage` store that no Server Action ever has, so they built a
    client with no base URL and an empty bearer. They now recover the session
    (new `igrpEnsureAccessClientConfig`) and refuse before contacting Access
    Management when none can be recovered — these are POST endpoints taking a
    caller-supplied `appCode`, so the two had to be fixed together.
  - `layoutData` replaces `layoutMockData`, which was production configuration
    wearing a preview-mode name. `layoutMockData` is still read for one release;
    setting both is rejected. New `igrpResolveLayoutDataSource` export.
  - `igrpBuildConfig` now validates `layout` and (when sync is on)
    `appInformation.name`. Both are required by `IGRPConfigArgs` and neither was
    checked; a missing `appInformation` surfaced inside `after()`, where nothing
    but a server log ever sees it.
  - The data hooks use `igrpGetAccessClient()` instead of four hand-rolled
    `AccessManagementClient.create` calls, so an unconfigured client now reports
    that clearly.
  - `apiManagementConfig.timeout` is honoured on read paths. It was dead config:
    nothing ever wrote it into the per-request store, which only defaults
    `timeout` when it *creates* the store, so every read-path client sat on the
    10s default. `IGRPLayoutFull` now threads it through to both providers.
  - `igrpGetClaims` decides the session-cookie name by probing the cookie jar
    rather than from `NEXT_PUBLIC_BASE_PATH` alone. `withIGRPAuth` only suffixes
    cookie names when `cookieIsolation` is `'basePath'` (its default), and this
    package cannot see that option — gating on the env var alone would have fixed
    the default configuration and broken `cookieIsolation: 'none'`.
  - `igrpSyncRoutes`: resource names replace every path separator
    (`/admin/users` produced `svc--admin/users`), and the param-map parser is
    brace-counted instead of a non-greedy regex that truncated on nested objects.
  - `igrpStartupSync` waits 60s before retrying a failed sync. It is scheduled
    via `after()` on every request, so a down Access Management server got a full
    sync attempt per request.
  - `useLayoutData` no longer awaits two documented no-op Server Actions before
    `router.refresh()`.
  - `IGRPRootLayout` accepts `lang` (defaults to `'pt'`); `IGRPLayoutFull` accepts
    `defaultSidebarOpen` (defaults to `true`).
  - `IGRPGlobalLoading` no longer throws or redirects out of a loading placeholder.
  - `igrpBuildQueryString` encodes parameter names as well as values.
  - `igrpEnsureAccessClientConfig` is exported from the package root.
  - Server-only modules carry a real `import 'server-only'` guard —
    `server-only` is now a declared dependency, so the existing guards resolve.
  - Adds a `typecheck` script (the last framework package without one) and runs
    `typecheck` + `test` in `release`. Removes the unused ESLint devDependencies
    and the dead `safe-await` / `toUpperCaseIdentifier` / `mapperMenu` /
    `mapperUser` exports.
  - The header and sidebar providers wrap a layout-data transport failure as
    `IgrpLayoutDataError` with code `IGRP_LAYOUT_DATA_FAILED` and the original
    error as `cause`, so a boundary's `onError` reporter gets a stable code
    instead of a bare `ApiClientError`. The code existed in `IgrpErrorCode` and
    was never thrown. `unstable_rethrow` runs first so a 401's `redirect('/login')`
    still reaches the router. `IGRP_APP_HOME_SLUG_INVALID`,
    `IGRP_AUTH_CONFIG_INVALID` and `IgrpAuthConfigError` are marked
    `@deprecated` rather than deleted — narrowing a public union is a breaking
    change even when nothing throws the members.
  - `parseRouteParamMap` skips string literals while brace-counting. An opening
    brace inside a string inflated the depth, so the scan never rebalanced and
    dropped that route **and every route after it** from the resource sync.
  - `vitest.config.ts` includes `.tsx`, which it did not — the layout providers
    could not be tested at all. They now have coverage (13 cases), as does
    `IGRPLayoutFull`'s wiring (5).
  - `showPreviewMode` is no longer written by `SidebarDataProvider` — no consumer
    reads it and the field is `@deprecated`.
  
  **`@igrp/framework-next-types`**
  
  - Adds `IGRPLayoutDataSource` and `IGRPConfigArgs.layoutData`; deprecates
    `IGRPMockDataAsync` (now an alias) and `layoutMockData`.
  
  **`@igrp/framework-next-auth`**
  
  - `resolveSecureCookiesFlag` moves to the shared `/cookies` entry point so
    `@igrp/framework-next` can reuse it instead of copying cookie logic.
  
  **`@igrp/template-migrator`**
  
  - Migration `39-layout-data-source-rename` switches `templates/demo-v1` to
    `layoutData`.
- 1eadf0f: Make `basePathCookieSuffix` injective, so two co-hosted apps can never share a
  session-cookie name.
  
  The `~` terminator makes the suffix set prefix-free. That is a different
  property from collision-free, and the slug transform was many-to-one: it folds
  every non-alphanumeric run to `-` and lowercases. So distinct basePaths produced
  the **identical** suffix:
  
  ```
  /apps/a-b        -> .apps-a-b~        ┐ same cookie name
  /apps/a/b        -> .apps-a-b~        ┘
  /apps/hr-admin, /apps/hr_admin, /apps/hr.admin  -> .apps-hr-admin~
  /apps/hr, /apps/HR                              -> .apps-hr~
  ```
  
  Two apps that collide get exactly the interference this module exists to
  prevent — same cookie name, same path, same host — so one decodes the other's
  token (wrong audience, wrong roles) and `SessionStore#clean()` deletes the
  other's session on sign-out.
  
  A basePath whose slug is ambiguous now carries a short hash of the original
  path: `/apps/a-b` -> `.apps-a-b.9f2b1c04~`. The separator is `.`, which the slug
  can never contain, so the hashed and unhashed classes stay disjoint and the
  suffix set stays prefix-free.
  
  ⚠️ **No cookie rename for ordinary deployments.** The hash is added only when
  slugging is actually lossy. A basePath of lowercase alphanumeric segments —
  `/apps/template`, `/apps/hr`, `/apps/a/b` — is reversible and keeps the exact
  name it has today, so no user is signed out and no second cookie is orphaned.
  A basePath containing uppercase, `_`, `.` or a literal `-` does change name
  once, and those users sign in again.
- ccfaeec: Add contract tests for the built output, and gate `release` on them.
  
  Several of this package's load-bearing properties exist only after bundling, so
  neither source review nor any existing test could see them:
  
  - the `"use client"` directive on `/client`, which esbuild strips and a tsup
    `onSuccess` hook puts back;
  - the Edge-safety contract, which is about what `dist/config.js` *statically*
    imports — `await import('next-auth')` and a static import look alike in source
    and are entirely different in the bundle;
  - the root barrel emitting no runtime dependencies;
  - one `Symbol.for` namespace across chunks, without which the shared state slots
    in `_global-state` are not actually shared.
  
  Two regressions reached a green build before this existed — a stripped
  `"use client"` directive, and per-chunk copies of the discovery cache and the
  in-flight refresh map — and both were found by grepping `dist/` by hand.
  
  `dist-contract.test.ts` also checks that every `exports` subpath and every
  `files` entry actually ships. It skips when `dist/` is absent so `pnpm test`
  works on a fresh clone, and `release` is now `build && test && publish`, so the
  checks run against freshly built output before anything is published.
- 39eb67c: One origin resolver for redirects, plus packaging and documentation fixes.
  
  - **`auth.resolveAppUrl(path, request)`** is new: it resolves an app-relative path against the app's browser-reachable origin (preferring `NEXTAUTH_URL` minus its `/api/auth` suffix, recovering the basePath from it when `NEXT_PUBLIC_BASE_PATH` is unset, falling back to the request origin). `getLoginRedirectUrl` is now just this applied to the configured `middleware.loginUrl`.
  
    Middleware that builds its own redirects with `new URL(path, request.url)` is resolving against the *internal* origin behind a TLS-terminating proxy, which points the browser somewhere it cannot reach. There were two implementations of "where is this app"; this is the one.
  
  - **The `env` option's limit is documented.** It governs everything this package reads, but cannot reach inside `next-auth`, whose `detectOrigin()` reads `process.env.NEXTAUTH_URL` / `VERCEL` / `AUTH_TRUST_HOST` directly and uses that origin for its own `callbackUrl` and for the `baseUrl` passed to `callbacks.redirect`. Use `env` to narrow or validate `process.env`, not to replace it.
  
  - **`DEFAULT_MATCHER` is documented.** Matchers are basePath-*relative*, so the `apps` alternative excludes a top-level `/apps` inside the app — it does not refer to a deployment mounted at `/apps/<name>`, and an app whose basePath is `/apps/template` is matched normally. It protected nothing by itself and read as though it did.
  
  - **Packaging:** the package declared `LICENSE` in `files` but shipped no such file, while declaring `license: "MIT"` — MIT requires the notice to travel with the code. Added, along with `CHANGELOG.md`, which consumers were not receiving.
- 23343a3: Repair the `IGRP_SESSION_REFETCH_INTERVAL` check, which could never fire
  correctly, and correct the docs around it.
  
  `warnOnRefetchIntervalMisconfiguration` compared the env var against
  `TOKEN_REFRESH_BUFFER_MS` and warned when it was too large. Nothing reads that
  variable. The client poll cadence is whatever the app passes as
  `sessionArgs.refetchInterval` — in `demo-v1`, a hardcoded 600s backstop — so the
  check inspected one value while guarding another: it passed on the documented
  `45` while the effective interval was `600`, ten times past the ceiling it
  existed to enforce.
  
  This is the fourth instance of the silent-no-op guard pattern recorded in the
  repo's `KNOWN-ISSUES.md`, after the `'use client'` quote bug, the missing
  `check:dist`, and the design system's `froms` regex.
  
  The check now warns about the only thing it can observe and be right about: the
  variable is set, and setting it does nothing. That makes it *capable of firing
  correctly*, which the previous version was not. Dev-only, warn-once, unchanged
  otherwise.
  
  Docs corrected to match:
  
  - `README.md` — the env table row is removed and the "`IGRP_SESSION_REFETCH_INTERVAL`
    has a hard ceiling" section is replaced by "There is no env var for the
    session-poll interval". The underlying constraint (a poll at or beyond the 60s
    proactive-refresh buffer only refreshes in read-only RSC context, where the
    rotated cookie cannot be persisted) is real and is retained — it is why
    `IGRPSessionWatcher` exists, not something a consumer configures.
  - The `TOKEN_REFRESH_BUFFER_MS` comment no longer points at the env var.
  
  No behavioural change beyond the warning text.
- 90d5a73: Fix post-login redirects, client-entry packaging and claim resolution in `@igrp/framework-next-auth`.
  
  **Redirects (user-visible)**
  
  - `callbacks.redirect` no longer builds the post-auth destination by concatenating `NEXTAUTH_URL_INTERNAL`. NextAuth v4 requires `NEXTAUTH_URL` to carry an `/api/auth` suffix under a `basePath`, so a sign-in with no `callbackUrl` landed the browser on the NextAuth API root instead of the app home. Destinations now resolve against the app base URL (`baseUrl`/`NEXTAUTH_URL` minus `/api/auth`).
  - `NEXTAUTH_URL_INTERNAL` is no longer used for anything that becomes a `Location` header — it names a server-to-server origin that is, by definition, unreachable from the browser in the deployments that set it. This applies to both `callbacks.redirect` and `getLoginRedirectUrl`.
  - `getLoginRedirectUrl` recovers the `basePath` from `NEXTAUTH_URL` when `NEXT_PUBLIC_BASE_PATH` is unset, instead of dropping it.
  - The auth chrome (`/login`, `/logout`) is no longer a valid post-auth destination; it redirects to home rather than bouncing the user back through the flow they just finished.
  
  **Packaging**
  
  - `./client` now ships a real `"use client"` directive. `next-auth`'s v4 `react` entry has none and esbuild strips top-level directives, so the entry was server-first despite its name.
  - The root barrel no longer re-exports `./middleware`, `./jwt` or `./oidc`. A single root import from a page pulled `next-auth/middleware` and the server-side token machinery (refresh, revocation, introspection, recovery store) into that page's bundle. Those symbols remain available from their subpath entries; the corresponding **types** are still re-exported from the root.
  
  **Correctness**
  
  - `session.user.id` is now populated from `token.user.id ?? token.sub`. It was declared in the public `Session` type and the `next-auth` module augmentation but never set, because the IGRP session callback replaces NextAuth's default.
  - `decodeIgrpClaims` no longer resolves roles from `aud[0]`. Keycloak commonly issues `aud: ["account", "<client-id>"]`, so the app's roles silently resolved to `resource_access.account` — indistinguishable from "no roles". Resolution is now `azp` → first non-built-in audience carrying roles → sole application entry → any audience carrying roles.
  - Introspection client authentication follows RFC 6749 §2.3.1 (form-urlencode before base64) and no longer throws on a non-ASCII client secret, which the surrounding catch turned into a silent fail-open that disabled the revocation gate.
  - `sanitizePath` now rejects protocol-relative (`//`), backslash and control-character inputs, and checks `..` by path segment — so a legitimate path such as `/reports/q1..q2` is accepted while traversal is still blocked.
  
  **Diagnostics**
  
  - `withIGRPAuth` warns once in development when `IGRP_SESSION_REFETCH_INTERVAL` is at or beyond the proactive-refresh buffer. The constraint was documented in a comment but never checked, which made the resulting refresh dead zone look like a random logout.
  - `env` is now honoured consistently: `secret`, `NEXT_PUBLIC_BASE_PATH` and `NODE_ENV` resolve from the injected `env` map before falling back to `process.env`.
  - Documented the IdP assumption behind `revokeOidcSession` (refresh-token revocation is assumed to revoke the whole grant).
- 8a6ecbe: Cookie isolation, control-flow safety, and refresh/claim correctness in `@igrp/framework-next-auth`.
  
  **Auth cookies are now scoped by basePath (behaviour change — see below)**
  
  NextAuth v4 names its cookies from a fixed basename at `path: "/"`. Two IGRP apps on the same host under different basePaths (`/apps/a`, `/apps/b` — the shape `NEXT_PUBLIC_BASE_PATH` exists for) therefore wrote the *same* cookie name, at the same path, on the same host: signing into one overwrote the other. With a shared `NEXTAUTH_SECRET` the second app silently decoded the first app's token (wrong audience, wrong roles); with different secrets it failed to decode and looped to `/login`.
  
  All six NextAuth cookies (session, callback-url, csrf, pkce verifier, state, nonce) now carry a basePath-derived suffix — csrf and pkce too, because a shared csrf token fails the other app's sign-in POST and a shared verifier breaks concurrent logins. Naming lives in the new `./cookies` entry, and `getToken` is told the resolved name explicitly.
  
  **This renames the session cookie for any app with a basePath, which signs every current session out exactly once on deploy.** Apps at the host root are unaffected (no suffix is applied). Opt out with `withIGRPAuth({ cookieIsolation: 'none' })`.
  
  The `Secure` flag (and the `__Secure-` / `__Host-` prefixes) is derived the same way `next-auth`'s own `detectOrigin()` does — `NEXTAUTH_URL`'s scheme, else https when `VERCEL` / `AUTH_TRUST_HOST` is set, else http. Deriving it from `NEXTAUTH_URL` alone would strip `Secure` from a session cookie served over HTTPS behind a TLS-terminating proxy with `NEXTAUTH_URL` unset. `useSecureCookies` is pinned to the same value, so the writer and `getToken` agree by construction rather than by coincidence. Override with `withIGRPAuth({ secureCookies: false })` for a deployment that really terminates plain http behind a trusted proxy.
  
  **Control flow**
  
  `getSession()` caught *everything* and returned `null`. `getServerSession` reads cookies/headers, so during a prerender it throws Next's static-render bailout — control flow, not failure. Swallowing it reported "no session", the route was never marked dynamic, and the page rendered (and could be cached) as logged out; a `redirect()` from a caller's callback was cancelled the same way. Next's signals and `IGRPAuthConfigError` are now re-thrown; only genuine read failures become "no session". The detector ships as `./runtime`.
  
  **Refresh**
  
  Concurrent refreshes share one network round-trip, but `performRefresh` built its result from whichever caller arrived first and handed that merged token to all of them — so custom fields set by a `callbacks.jwt` extension leaked between sessions. The shared promise now resolves to the auth material only, and each caller applies it to its own token. Rotation-store recovery does the same.
  
  **Token expiry on sign-in**
  
  When the IdP returned no `expires_at`, the JWT assumed a full hour of validity. Against a ~3-minute access token that meant middleware never bounced, the jwt callback never refreshed, and every access-management call 401'd for ~57 minutes with nothing in the session explaining why. Expiry now resolves `expires_at` → `expires_in` → the access token's own `exp` claim → a short 5-minute fallback that the first refresh corrects.
  
  **Claims**
  
  - `decodeIgrpClaims` now decodes `exp` (as `expiresAt`, in ms) and ships `claimsExpired()`. No signature verification was always deliberate — the token arrives sealed in the NextAuth cookie — but that argument covers authenticity, not freshness, and a caller reading the cookie directly (`getToken` decrypts, it does not refresh) was honouring permissions from a long-expired token.
  
  **Other**
  
  - `buildEndSessionUrl` validates `post_logout_redirect_uri` against the app origin plus an optional `IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS` allowlist. It reaches the framework from a Server Action parameter — a publicly callable endpoint — and was previously passed through unchecked. When `NEXTAUTH_URL` is unset the origin cannot be derived, so the value is accepted with a warning rather than breaking logout.
  - `introspectOidcToken` no longer fails open in silence; each reason warns once per process.
  - Sign-out revocation is bounded as a whole (5s) rather than per fetch — it does discovery *then* revoke, serially, so the per-fetch ceiling allowed roughly double the wait before the cookie was cleared.
  - `hasAccessToken` checks the token's value, not just the presence of the key.
  - The `next-auth` module augmentation in `./types` is derived from the exported `Session`/`JWT` types instead of restating them; the two copies had already drifted.
  - Tests for previously uncovered exports: `escapeHtml`, `interopDefault`, `getLoginPath`, `sanitizeString`, `hasAccessToken`, `getServerSessionStrict`, `isIGRPAuthConfigError`.
- 1237546: `withIGRPAuth().serverSession()` (and `getSession()`, which calls it) now reads the session once per RSC render instead of once per call.
  
  A layout tree reads the session from several places that render in parallel — the root layout for the client `SessionProvider`, the authenticated layout through `getSession()` — and every read decrypted the session cookie and ran the `jwt` and `session` callbacks again. The `getServerSession` call is now wrapped in `React.cache`, which is scoped to the current render; outside one (Route Handlers, Server Actions) it is a passthrough, so a session is never shared across requests. `react` is loaded lazily alongside `next-auth`, so the Edge-reachable static import graph of `./config` is unchanged.
  
  Callers that seed per-request state from the session (e.g. `igrpSetAccessClientConfig`) must keep doing so themselves after each call — only the read is memoized, not the caller's side effects.
- 342a9ba: Share process-wide state across entry chunks, and bring the README back in line with the code.
  
  **Module state was duplicated per entry point**
  
  `tsup` builds with `splitting: false`, so every entry inlines its own copy of every module it imports — and a template loads two of them (`withIGRPAuth` from `/config`, `buildEndSessionUrl` from `/oidc`). `oidc.ts` already knew this: the token recovery store lives on `globalThis` under `Symbol.for` with a comment explaining exactly why. That reasoning was never applied to the state sitting next to it.
  
  The OpenID discovery cache, the in-flight refresh map and the warn-once flags now use the same mechanism, via a new internal `_global-state` module:
  
  - The `/oidc` chunk no longer re-fetches a discovery document the `/config` chunk has already cached — that was an extra IdP round-trip (4s timeout ceiling) on the user-blocking logout path, which is precisely where the fetch budgets exist.
  - The in-flight refresh dedup can no longer split. Nothing refreshes through a second entry today, so this was latent rather than broken — but that map exists because a split produces `invalid_grant` and logs users out of healthy sessions, and the invariant protecting it was undocumented.
  - "Warn once per process" is now once per process rather than once per chunk.
  
  Test suites that relied on `vi.resetModules()` handing them a fresh cache must call `resetGlobalStateForTests()`; slots deliberately outlive module reloads.
  
  **Provider profile id**
  
  `profile.sub` had no fallback, though every other field in the mapper did. An IdP omitting it produced `id: undefined`, which sign-in tolerates and which then surfaces much later as a permanently empty `session.user.id`. Now falls back to `preferred_username` then `email` with a one-time warning that those are not stable across a rename, and returns `''` — a failed sign-in — when nothing usable exists.
  
  **Documentation**
  
  - `NEXTAUTH_URL_INTERNAL` was still documented as the redirect origin. Its use there was removed as a bug (it names a server-to-server origin, so the browser got a `Location` it could not reach); the README now says so explicitly rather than inviting operators to set it for an effect it no longer has.
  - Six environment variables the package reads were undocumented: `AUTH_TRUST_HOST`, `VERCEL`, `NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_IGRP_APP_HOME_SLUG`, `IGRP_SESSION_REFETCH_INTERVAL`, `IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS` — including the 60s ceiling on the poll interval and how cookie naming and the `Secure` flag are derived.
  - Added `withIGRPAuth` options and middleware-primitive tables covering `tokenRecoveryStore` (undocumented since it was introduced), `cookieIsolation`, `secureCookies` and `resolveAppUrl`.
- 147f51a: Fix a silent React Compiler bailout, three stale-state bugs in the app shell, a
  gate that failed open, and an SSR/client split on every external menu link.
  
  ### ⚠️ `IGRPAuthForm` had lost React Compiler memoization, silently
  
  `babel-plugin-react-compiler` (through 1.0.0) cannot lower a `TryStatement` with
  a finalizer — `Todo: (BuildHIR::lowerStatement) Handle TryStatement with a
  finalizer ('finally') clause`. It swallows that per function and emits the
  module **uncompiled**, so the build stays green while memoization disappears.
  `onSubmit`'s `try/catch/finally` put the whole login form in that state, and
  nothing in source review, `tsc` or the test suite could see it.
  
  The `finally` was wrong on its own terms too: on the happy path `signIn()` never
  resolves — it navigates away — so clearing the loading flag there un-spun the
  button mid-redirect. It is now cleared only on the failure path.
  
  `src/__tests__/build-pipeline.test.ts` asserts on the emitted `dist/` that every
  eligible client module carries compiler output — `.ts` as well as `.tsx`, since
  a hook is exactly as memoizable as a component and a bailout in one is exactly
  as silent. A second assertion pins that the first is not passing vacuously by
  naming the three client hooks it must be covering. It skips when `dist/` is
  absent, and `release` now runs `build && typecheck && test` before publishing.
  
  ### ⚠️ The published types were silently `any` for `nodenext` consumers
  
  `@igrp/framework-next-ui` and `@igrp/framework-next` are both `"type": "module"`,
  and `tsc --emitDeclarationOnly` copies module specifiers into `dist/*.d.ts`
  verbatim. Every relative specifier they emitted was extensionless — 62 and 17
  respectively — which is TS2835 under `moduleResolution: "node16" | "nodenext"`.
  Because the error is raised *inside a `.d.ts`*, the near-universal
  `skipLibCheck: true` swallows it and every exported type resolves to `any`.
  
  Reproduced against the published layout: a consumer could write
  
  ```ts
  export const bad: IGRPMenuLabels = { totallyMadeUpField: 12345 };
  export const alsoBad: IGRPForbiddenProps = { homeHref: { not: 'a string' } };
  ```
  
  and `tsc` exited **0**. The same file now reports TS2353 and TS2322.
  
  This is the identical defect already diagnosed and fixed in
  `@igrp/framework-next-types`; the fix was never carried to the two sibling
  packages with the same build shape. Note it affected only the **declarations** —
  `scripts/babel-plugin-add-import-extension.cjs` has always fixed the `.js` half,
  so the packages loaded correctly at runtime and only their types were broken,
  which is exactly how it survived three source-level reviews. Nothing in-repo
  could catch it either: `templates/demo-v1` uses `moduleResolution: "bundler"`,
  which accepts both spellings.
  
  Relative imports in `src/` now carry an explicit `.js` extension (174 specifiers
  across both packages, including dynamic `import()`), and both packages gained
  the `check:dist` gate `next-types` already had, wired into `build` and into the
  `build:without_reactcompiler` escape hatch. The Babel plugin is idempotent for
  specifiers that already carry an extension, so one spelling in `src/` satisfies
  both emitters. **No API change** — but an external `nodenext` consumer that was
  compiling green may now see real type errors for the first time.
  
  ### ⚠️ Every external menu link rendered differently on the server and the client
  
  `resolveAnchorTag` was built on the design system's `igrpIsExternalUrl`, which
  compares against `window.location.origin` **inside a `try`**. Under SSR the
  `ReferenceError` is swallowed and it answers `false` for every URL. So the
  server rendered external menu items as `next/link` and the client re-rendered
  them as `<a target="_blank" rel="noopener noreferrer">` — a hydration mismatch
  on the element type itself, plus a window in which the link carried no
  `rel="noopener"`.
  
  Externality is now decided from the URL's own shape (scheme or
  protocol-relative), which gives the same answer on both sides of hydration.
  `@igrp/igrp-framework-react-design-system` is unchanged; its helper is still
  correct in the browser, just not usable in code that server-renders.
  
  ### ⚠️ `IGRPAuthorization` and `IGRPGuardPage` failed open on an empty list
  
  `[].every(...)` is `true`, so `permission={[]}` rendered gated children to
  **everyone** under the default `mode="all"`, while the same input under
  `mode="any"` denied. An empty list now denies in both modes, through a shared
  `igrpIsAllowedBy` that both components — and consumers — can call. These remain
  client-side rendering control; the authoritative gate is still the server-side
  `igrpAssertAuthorize`.
  
  ### Stale state in the persistent chrome
  
  - **Folders no longer open on navigation.** The sidebar mounts once per session,
    so `<Collapsible defaultOpen>` was read on that one mount and never again:
    navigating from a leaf in folder A to a leaf in folder B left B collapsed
    while its trigger showed the active highlight. The open state is now
    controlled and opens on the `hasActiveChild` edge, so it reveals the route the
    user landed on without fighting a manual collapse elsewhere.
  - **Breadcrumbs re-measure their overflow.** `useBreadcrumbOverflow` observed an
    element whose box never changes when its children do, with deps of
    `[containerRef]` — so it measured once at mount and every later answer was
    stale: a long trail measured at mount kept its ellipsis on a two-segment
    route, and vice versa. It now takes a required `contentKey`, derived from the
    items (never from the collapsed output, which would oscillate).
  - **The session watcher reacts to navigation.** It read
    `window.location.pathname` inside an effect that depended only on
    `[status, session, router]`, so an unauthenticated user who client-navigated
    into a protected route was never redirected — `status` had not changed.
  - **Menu search survives a re-render.** The query reset keyed off the `menus`
    array identity, clearing what the user was typing on every render in which the
    caller rebuilt the array — which is every render for anyone passing an inline
    literal.
  
  ### Menu tree: nested folders are no longer dropped
  
  A `FOLDER` inside a `FOLDER` was typed as a leaf, so its entire subtree vanished
  from both the sidebar and menu search — routes the backend advertised became
  unreachable, with no error. The sidebar still renders two levels (that is what
  `SidebarMenuSub` and the icon-mode dropdown express), but deeper descendants are
  now hoisted into the nearest folder rather than discarded, with a cycle guard on
  `parentCode`.
  
  ### Accessibility
  
  - **Carousel.** `opacity-0` + `pointer-events-none` blocks the mouse and nothing
    else, so off-screen slides stayed in the tab order and the accessibility tree —
    with four slides, a keyboard user tabbed through sixteen invisible dots and a
    screen reader announced all four headings. Inactive slides are now `inert` +
    `aria-hidden`, and the dot strip is rendered once for the carousel instead of
    once per slide.
  - **Icon-mode menu dropdown now closes on selection.** An `onSelect` that called
    `preventDefault()` suppressed Radix's close, leaving the menu open over the
    page just navigated to.
  - **Folders emit one list item.** The icon-mode and expanded surfaces were two
    `SidebarMenuItem`s and only the button of the hidden one was hidden, leaving an
    empty `<li>` per folder in expanded mode.
  - **The header's settings link had no accessible name.** It renders an icon and
    nothing else, so a screen reader announced only the href. It now carries an
    `aria-label` plus `sr-only` text, overridable via `settingsLabel`.
  - `<p>` inside `<h3>` in the login form (the parser closes the heading early, so
    the DOM React hydrates is not the one it built), and an unbounded unread badge
    that could overflow its 14px circle.
  - The theme selector keyed its options by display `name`, which the standard and
    scaled groups share by design — now keyed by `value`, the CSS class suffix,
    which is unique by construction.
  - **The command palette's accessible name was English.** The design system's
    `CommandDialog` renders its `title` into an `sr-only` `DialogTitle` and
    defaults it to "Command Palette"; nothing passed one, so the one string only
    screen-reader users hear was the one string not in pt-PT. Now
    `labels.dialogTitle` / `labels.dialogDescription`.
  - **`IGRPLayoutErrorBoundary` reports what it catches.** It had no
    `componentDidCatch` at all — it rendered its fallback and dropped the error
    with no log, no stack and nothing for an observability tool to hook. It now
    logs by default and takes an `onError(error, info)` for a real reporter.
  - **The active theme no longer flashes.** The `theme-*` class was applied to
    `<body>` in a passive `useEffect`, i.e. after the browser had already painted
    — so every load showed the default theme first. It now uses a layout effect
    (isomorphic, so SSR does not warn), and `igrpActiveThemeClassName()` is
    exported so a root layout can render the class server-side and remove the
    flash before hydration too. `IGRP_ACTIVE_THEME_COOKIE` is exported alongside it.
  - `IGRPTemplateLoading` dropped an `aria-label` that duplicated — and would
    silently override — its own visible status text.
  
  ### pt-PT defaults, exposed as overridable props
  
  The chrome mixed hardcoded English (`Profile`, `Notifications`, `Settings`,
  `Log out`, `Mark all as read`, `Home`, `Toggle menu`, `(opens in new tab)`,
  `Applications Center`) into otherwise pt-PT surfaces, with no way for a consumer
  to change it. Every such string is now pt-PT by default and overridable.
  
  `IGRPTemplateModeSwitcher` and `IGRPTemplateThemeSelector` were English
  end-to-end with no props at all — including the theme names themselves
  (`Default` / `Blue` / `Green` / `Amber`), which is why the selector also gained
  `themes` / `scaledThemes`. Pass `scaledThemes={[]}` to hide the scaled group.
  
  New catalogs and props — all additive: `IGRP_MENU_LABELS_PT_PT`,
  `IGRP_NAV_USER_LABELS_PT_PT`, `IGRP_NOTIFICATIONS_LABELS_PT_PT`,
  `IGRP_COMMAND_SEARCH_LABELS_PT_PT`, `IGRP_MODE_SWITCHER_LABELS_PT_PT`,
  `IGRP_THEME_SELECTOR_LABELS_PT_PT`, `IGRP_DEFAULT_THEMES`, `IGRP_SCALED_THEMES`,
  plus `menuLabels` / `navUserLabels` on `IGRPTemplateSidebar`, `labels` on every
  component that owns copy, `settingsLabel` on `IGRPTemplateHeader`, and
  `subtitle` / `homeHref` / `homeLabel` on `IGRPTemplateNotFound`.
  `IGRPTemplateMenus`' `navAriaLabel` prop is deprecated in favour of
  `labels.navAriaLabel` and still wins for one release.
  
  Substitution goes through the design system's `igrpFormatMessage`, not
  `String.prototype.replace(string, string)` — which interprets `$&`, `` $` ``,
  `$'` and `$n` **in the replacement**. Menu names come from the backend and the
  search query is typed by the user, so a `$` sequence corrupted the output and
  leaked the surrounding template: searching `` a$`b `` rendered
  `Sem resultados para "aSem resultados para "b".`
  
  The design system's `useIGRPi18n()` catalog is closed to this package —
  `IGRPI18nStrings` enumerates DS component groups and the provider merges a fixed
  list — so props are the seam. `useIGRPLocale()` **is** usable, and
  `IGRPTemplateNotifications` now takes its timestamp locale from there instead of
  defaulting to a hardcoded `pt-PT`.
  
  ### API corrections
  
  - **`IGRPTemplateHeader` can feed its own command palette.** `commands` is now a
    prop; without it the built-in palette opened empty on every shortcut, and the
    only way to give it contents was replacing it wholesale via `slots.search`.
  - **`IGRPTemplateSidebar` renders `IGRPSidebarError` instead of throwing** when
    `data` is missing. A render throw from a client component escapes to the
    nearest boundary and takes the whole segment down for a pane-level problem.
  - **`IGRPTemplateNavUser`'s settings link defaulted to `/setting`** while the
    header's defaulted to `/settings`; whichever an app had not routed 404'd. Both
    are `/settings` now, and `logoutUrl` is a prop rather than a hardcoded
    `/logout`.
  - **The Applications Center entry was hidden from every two-app tenant**
    (`listApps.length > 1`). It now shows whenever `appCenterUrl` is set.
  - **Dead props removed**: `baseUrl` on `IGRPTemplateSidebar` and
    `IGRPTemplateAppSwitcher` — both declared in exported types, neither ever
    read. Nothing in the repo passed either.
  - **Newly exported**, all previously unreachable: `useIGRPThemeConfig` (the
    provider shipped without its hook, so the active theme could only be changed
    through the built-in selector), `IGRPThemeProvider`, `IGRPTemplateImage` and
    `igrpIsAllowedBy`.
  - `IGRPTemplateHeader.data` is typed optional, matching the `if (!data) return
    null` it already had, and takes a `fallbackLogo` prop — the logo path is a
    contract with the consuming app's `public/`, since this package publishes
    `dist` only.
  - **The header now threads every child's label overrides**, not just
    `navUserLabels`: `commandSearchLabels`, `notificationsLabels`,
    `modeSwitcherLabels`, `breadcrumbHomeLabel` and `breadcrumbEllipsisLabel`.
    Each child owned a catalog that was unreachable through the header, which is
    how apps actually mount them.
  - **`IGRPGuardPage` forwards its 403 copy** — `forbiddenProps`, plus a
    `fallback` that replaces the screen outright. `IGRPForbidden`'s props existed
    and the guard passed none of them.
  - **`IGRPNestedProviders` dropped a `className` prop** it declared and never
    read — the same dead-prop defect removed from the sidebar and app switcher.
  - `useIGRPThemeConfig` threw naming two symbols that do not exist
    (`useThemeConfig`, `ActiveThemeProvider`); harmless while the hook was
    private, and now it is exported.
  - The `toasterConfig` spread on `IGRPToaster` is replaced by explicit props: it
    passed `showToaster` (a framework flag sonner has no use for) through, and
    re-applied raw values *after* the defaults resolved, so an explicit
    `position: undefined` beat the `'bottom-right'` default.
  
  ### `@igrp/framework-next-auth`: `useOptionalSession`
  
  `./client` gains `useOptionalSession` (and the raw `SessionContext` it reads).
  `useSession()` throws without a provider and `useSafeSession` delegates straight
  to it, so neither can serve a component that must also render standalone —
  `IGRPSectionPermissions` does, and was reaching into `next-auth/react` directly
  for the context. It returns `null` for "no provider mounted", which means
  *cannot tell*, not "unauthenticated"; a permission gate must keep its
  server-seeded answer in that case rather than denying. Additive; no existing
  export changes.
  
  ### `@igrp/framework-next-types`: `menuItems` is optional
  
  `IGRPSidebarDataArgs.menuItems` is now optional, closing repo `KNOWN-ISSUES` #3.
  It is discarded whenever auth is real — `SidebarDataProvider` replaces it with
  `fetchMenus(appCode)` — so requiring it only forced every production app to
  author an array that is thrown away. `IGRPTemplateSidebar` supplies the `[]`
  default that made the type change safe.
  
  ### Housekeeping
  
  - **`src/index.css` removed.** It declared `@import 'tailwindcss'` plus a
    `@theme inline` block and a base layer, was in neither the `exports` map nor
    any import, and was still copied into `dist` — so the only way it could ever
    have been used was to start a second Tailwind build inside a consuming app,
    which `.claude/shared/tailwind-v4.md` forbids. `tokens.css` is unaffected and
    still the `./tokens` entry.
  - **`typecheck` script added**, closing this package's share of repo
    `KNOWN-ISSUES` #1 — the root `pnpm typecheck` now covers three of the four
    framework packages (`@igrp/framework-next` is the last one missing).
  - **`vitest` include widened to `.tsx`**, so a component test no longer requires
    editing the config first. New tests cover the menu tree builder, the
    SSR-safety of external-URL detection, the permission decision, and the build
    pipeline.
  - `withBasePath` / `stripBasePath` were copy-pasted across four files; they now
    live in `lib/utils.ts`.
  - `TODO.md` was empty and is gone. `public/` is not published (`files: ["dist"]`)
    and now carries a README saying so — those assets are a contract with the
    consuming app's own `public/`, resolved by URL from the app's origin, so
    publishing them would ship bytes no consumer can reach.
  - README rewritten: every export name in its tables was wrong (`IGRPHeader`,
    `IGRPSidebar`, `IGRPMenus`, `NestedProviders`, `IGRPModeToggle`, … — none of
    them exist), and it documented a `Node >= 20` / `Next ^15.5.15` requirement
    that does not match `package.json`.
  - Stale comments corrected: `babel.config.cjs` described a React Compiler pass
    over SWC output in `dist/` (there is no SWC step and no dist input), and four
    components carried `src/components/templates/…` paths that have not existed
    for some time.
- 75fd1bc: Fix a set of auth defects found across two deep reviews of
  `@igrp/framework-next-auth`. **Three behaviour changes need reading before
  deploying** — they are marked below.
  
  ### ⚠️ Auth cookies are renamed under a basePath
  
  basePath cookie suffixes were not prefix-free, and NextAuth's `SessionStore`
  collects every cookie whose name `startsWith` the configured one (that is how it
  reassembles `.0`/`.1` chunks). `/apps/hr` therefore collected `/apps/hr-admin`'s
  session cookie as one of its own chunks, concatenated the values, failed to
  decrypt the result and saw no session — a permanent `/login` loop with a valid
  cookie present. `SessionStore#clean()` then expired every collected name, so
  signing in or out of `/apps/hr` deleted `/apps/hr-admin`'s session.
  
  Suffixes now end in a `~` terminator (`next-auth.session-token.apps-hr~`), which
  makes the set prefix-free. **This signs out current sessions once**, and the
  pre-rename cookie is not cleared automatically — `igrpDeleteAuthCookies()` from
  `@igrp/framework-next` matches by basename and sweeps both forms.
  
  ### ⚠️ An absent `AUTH_PROVIDER` no longer disables authentication
  
  The default was `none`, so an app that never set the variable ran with auth off
  — while the README documented `igrp-auth` as the default. The default is now
  `igrp-auth`: an unconfigured app fails closed with the `IGRPAuthConfigError`
  page (missing `IGRP_AUTH_*`) instead of serving unauthenticated traffic.
  Disabling auth still works, but must be explicit: `AUTH_PROVIDER=none`.
  
  ### ⚠️ `AUTH_PROVIDER=` (empty) is refused, not defaulted
  
  An empty assignment now throws with code `AUTH_PROVIDER_EMPTY`. It is deliberately
  not treated as "absent": the value this variable falls back to decides whether
  auth runs at all, so a typo must not be able to switch it off. `isAuthEnabled`
  maps the throw to "enabled", i.e. the failure is closed as well as loud.
  
  ### Other fixes
  
  - **Custom providers no longer expire on a schedule.** `withIGRPAuth({ provider:
    GitHubProvider({...}) })` stamped `authProviderId` from `AUTH_PROVIDER` (unset
    in that case), so the session was labelled `"none"`, discovery resolved to `''`,
    `fetch('')` threw and the first refresh force-logged the user out. The id now
    comes from the resolved provider; the jwt callback skips the whole OIDC
    lifecycle for a provider this package does not manage; and no access-token
    expiry is invented for one, so its session lasts as long as the NextAuth
    cookie instead of dying at the 5-minute fallback.
  - **A missing `NEXTAUTH_SECRET` is an `IGRPAuthConfigError`** (`AUTH_SECRET_MISSING`)
    in production instead of a silent `/login` loop — `getToken` does not throw on
    a missing secret, it returns `null` for every request. Development warns only.
  - **Warn when the IdP's access-token lifetime sits inside the 60 s
    proactive-refresh buffer**, where every session read refreshes and every server
    render treats the fresh session as expired and redirects to `/logout`. Checked
    on refreshed tokens too, not just at sign-in.
  - **Rotation-recovery entries are validated and re-checked.** A recovered token
    whose access token is spent is still adopted (it carries the rotated refresh
    token) but now triggers a refresh instead of being returned dead; a malformed
    entry is ignored. Sign-out drops the session's entry via the new optional
    `IGRPTokenRecoveryStore.delete`, inside the existing sign-out time budget —
    which now covers every remote hop the event makes, not just the revoke.
  - **`sanitizeRedirectUrl` keeps the fragment** on a same-origin absolute URL, so a
    deep link resolves identically whether passed absolute or relative.
  - **`typecheck` runs before publish.** `release` is now `build && typecheck &&
    test && publish`. The compile-time guard for the `next-auth` module
    augmentation is only ever run by `tsc`, and nothing ran `tsc`. The package also
    enables `noUnusedLocals` / `noUnusedParameters`, since it has no ESLint config
    and `pnpm lint` silently skips packages without a `lint` script.
  
  Also adds `isOidcManagedProviderId`, `forgetRecoveredToken`,
  `isUsableRecoveredToken` and the `SessionAuthProviderId` type; makes
  `getAuthProviderDefinition` throw a named error for an unknown id; and tightens
  `dist-contract.test.ts` to reject a `.d.ts` that exports nothing.
- e900763: Fix the `next-types` package boundary and gate its Access Management types against the real DTO contract.
  
  **`@igrp/framework-next-types`**
  
  - The manifest advertised `main` / `module` / an `import` condition pointing at `dist/index.js`, which the declaration-only build never emits. `exports` now carries a `types` condition only — no phantom runtime entry.
  - Declared the peers the public surface actually embeds: `IGRPConfigArgs.sessionArgs` is `Partial<SessionProviderProps>`, which is React-typed, so `react` and `next` are now (optional) peers alongside `next-auth`.
  - `declarationMap` was on while `files` shipped `dist` only, so every published `.d.ts.map` pointed at sources that were not in the tarball. `src` now ships too.
  - Realigned the AM types with `@igrp/platform-access-management-client-ts`, which they mirror by hand and had drifted from: `IGRPPermissionArgs.description`, `IGRPRoleArgs.description` / `parentCode` and `IGRPDepartmentArgs.description` accept `null`; `IGRPRoleArgs.name` and `IGRPDepartmentArgs.status` are optional; `IGRPRoleArgs`, `IGRPResourceArgs` and `IGRPResourceItem` carry permission **names** (`string[]`) rather than permission objects; `IGRPResourceArgs.id` / `status` and `IGRPResourceItem.id` are optional; `IGRPFileUrlArgs.expiration` accepts a `Date`.
  - Added `contract/am-contract.ts` plus `pnpm check:contract` (wired into `build`): a build-time assertion that every AM DTO is assignable to its framework counterpart, so this drift cannot recur silently. The AM client is a devDependency and never reaches the published output.
  - `IGRPRoleDepartmentArgs` is now exported from the barrel — it is the element type of the required `IGRPMenuItemArgs.roles` but could not be named by consumers.
  - `IGRPHeaderDataArgs`: the eight `show*` flags are optional (default `false`, matching the renderer's existing truthiness checks) instead of all required.
  - `IGRPNotificationArgs.timestamp` accepts `string | Date`; ISO 8601 strings are now the documented form.
  - Marked the unused pure AM mirrors `@deprecated` in favour of the client's own DTOs: `IGRPResourceArgs`, `IGRPResourceItem`, `IGRPResourceType`, `IGRPGlobalConfigurationArgs`, `IGRPConfigurationType`, `IGRPFileUrlArgs`, `IGRPRoleUserArgs`.
  - `IGRPConfigArgs.layoutMockData` references `IGRPMockDataAsync` instead of re-declaring it inline; `Session` is imported from the `@igrp/framework-next-auth/session` subpath rather than the root barrel.
  - Added the missing `LICENSE`, and corrected a README that documented type names which do not exist (`IGRPConfig`, `IGRPSidebarConfig`, `IGRPHeaderConfig`), a `Session`/`JWT` re-export that does not happen, and the wrong Node/next-auth ranges.
  
  **`@igrp/framework-next`**
  
  - Dropped the unchecked `as IGRPStatus` / `as IGRPMenuType` / `as IGRPTargetType` casts from the application and menu mappers. TypeScript accepts a string enum where its literal union is expected, so the casts were never load-bearing — they only hid drift, and the contract gate now proves the assignment is sound.
  - `mapApplication` no longer silently drops `lastAccess`.
  
  **`@igrp/framework-next-auth`**
  
  - Split the type-check and emit configs. `tsconfig.json` carried `composite: true`, `noEmit: false` and `outDir: ./dist` on a package whose `dist/` is produced entirely by tsup, so any stray `tsc` or `tsc -b` in the package wrote a second, competing build over the tsup output. It is now type-check-only (`noEmit`, non-composite) with a `typecheck` script; `tsconfig.build.json` remains the composite, declaration-only emitting config. tsup's `dts` pass pins `noEmit: false` so the new config cannot silence declaration output — the `dist-contract` suite is what catches that if it regresses. No change to the published build.
  
  **`@igrp/framework-next-ui`**
  
  - `IGRPTemplateNotifications` called `.toLocaleString()` straight on `timestamp`, which throws when notifications come from a JSON API (a string, not a `Date`), and formatted with the ambient locale and time zone, producing a hydration mismatch on every row. It now accepts both forms, renders inside a `<time dateTime>` element, takes a `locale` prop (default `pt-PT`), and renders empty rather than `Invalid Date` for unparseable input.

## 0.2.0-beta.0

### Minor Changes

- Start the `0.2.0-beta` pre-release line (from `0.1.0-beta.*`). No code changes relative to the last `0.1.0-beta` build on this branch.

## 0.1.0-beta.146

### Patch Changes

- fd98d4c: - `cn()` is now backed by the official `cn` package instead of `clsx` + `tailwind-merge`; the exported API is unchanged for consumers.
  - Resizable primitives updated to the react-resizable-panels v4 API (`Group`/`Separator`, `aria-orientation` variants); the drag handle grip icon is replaced by a slimmer bar.
  - Build configuration fixes for `next-auth` (TypeScript deprecation flag) and `template-migrator` (explicit `node` types).
- Library packaging hygiene across all published packages:
  
  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.

## 0.1.0-beta.145

### Patch Changes

- f3e0c00: Library packaging hygiene across all published packages:

  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.

## 0.1.0-beta.144

### Patch Changes

- 3847b8b: Add token-claims permission gating: `decodeIgrpClaims`/`claimsAllow` (`@igrp/framework-next-auth/claims`), server helpers `igrpGetClaims`/`igrpAuthorize`/`igrpAssertAuthorize` (`@igrp/framework-next`), and client `IGRPSectionPermissions`/`usePermissions`/`IGRPAuthorization`/`IGRPGuardPage`/`IGRPForbidden` (`@igrp/framework-next-ui`).
- a274c6e: Require Node `>=22` (`engines.node`). As the root of the framework dependency chain this package previously declared no Node floor at all, leaving consumers and CI unconstrained while every other framework package requires Node 22.
- c9cd44b: Harden redirect sanitization: reject backslash (raw and %5C-encoded),
  path-traversal vectors, and control characters (tab/newline/CR, which URL
  parsing strips into `//`) in `sanitizeRedirectUrl`, and route the NextAuth
  `redirect` callback's relative-path branch through it. Closes a
  protocol-relative open-redirect (`/\evil.com`) at the framework layer.
- 3b808b8: Normalize the post-login `home` URL join when `NEXTAUTH_URL_INTERNAL` is set
  (exactly one slash between base and slug); coerce a non-numeric/absent OIDC
  `expires_in` to the 3600s default so a malformed value can no longer yield a
  `NaN` token expiry.
- 7d48f03: Document that the IGRP `Session` intentionally carries `accessToken` and
  `idToken` to the client (the browser AM client reads `accessToken`;
  `refreshToken` is omitted), and that consumers must never log or serialize the
  session object client-side — telemetry must redact it. Added as JSDoc on the
  `Session` type (ships in the published `.d.ts`) and a note at the session callback.

## 0.1.0-beta.143

### Patch Changes

- 5b335b8: fix(oidc): warn in production when the IdP returns no fresh id_token on refresh-token grant. Previously the warning was gated to dev only, so a misconfigured IdP silently broke RP-initiated logout in deployed environments — exactly where operators most need the signal.

## 0.1.0-beta.142

### Patch Changes

- fc2fe20: - `next-auth`: add `console.error` diagnostics when introspection marks the refresh token inactive or when `refreshOidcAccessToken` returns an error flag or throws — makes login-loop root causes visible in server logs
  - `next`: replace `unstable_cache` with `React.cache()` in `use-user` — prevents stale 401s caused by rotating access tokens being embedded in the `unstable_cache` key

## 0.1.0-beta.141

### Patch Changes

- a9b2297: Pluggable rotation-recovery store for multi-replica deployments. New on the `./oidc` entry: `IGRPTokenRecoveryStore`, `createInMemoryTokenRecoveryStore`, and `configureOidcTokenRecoveryStore` (globalThis-backed so all bundled module copies share one store). `withIGRPAuth` accepts a `tokenRecoveryStore` option; the shared-store implementation is consumer-supplied (no storage backend is bundled or prescribed). On a permanent refresh rejection (`invalid_grant`), the refresh now re-checks the store before flagging `RefreshAccessTokenError`, recovering sessions whose refresh token was rotated by another replica. Store failures degrade to a cache miss with a once-per-process warning. API note: `getRecoveredToken` is now async (`Promise<JWT | null>`); default behavior without the new option is unchanged (in-memory, per-process).

## 0.1.0-beta.140

### Patch Changes

- 5ebe890: The RFC 7662 token-introspection request now uses the same 4s timeout as discovery and revocation. A slow or hanging introspection endpoint no longer stalls token refreshes; on timeout the check fails open (token assumed live), as before.

## 0.1.0-beta.139

### Patch Changes

- 4e0137a: - Remove debug `console.debug` trace calls from OIDC token refresh (`refreshOidcAccessToken`), end-session URL builder (`buildEndSessionUrl`), and the `events.signOut` handler; retain all `console.warn`/`console.error` calls with diagnostic value

## 0.1.0-beta.138

### Patch Changes

- Fix `getAccessToken` returning null (and RP-initiated logout failing with `[getLogoutUrl] no active token found`) on HTTPS deployments behind a TLS-terminating proxy.

  `getToken` infers the session-cookie name solely from `NEXTAUTH_URL`'s scheme, but NextAuth's request handler writes the `__Secure-`-prefixed cookie based on the request origin (`x-forwarded-proto`, `AUTH_TRUST_HOST`, or a build-time-inlined `NEXTAUTH_URL` in the Edge middleware). When the app runs over HTTPS via a proxy while the Node runtime's `NEXTAUTH_URL` is `http`/unset, the handler stores `__Secure-next-auth.session-token` while `getToken` looks for the bare `next-auth.session-token` and finds nothing — login keeps working but `getAccessToken` silently fails.

  `getAccessToken` and `getTokenFromRequest` now detect the actual session-cookie prefix present on the request and pass an explicit `secureCookie` flag to `getToken`, keeping the reader in sync with the writer regardless of how the scheme was detected.

## 0.1.0-beta.137

### Patch Changes

- Fix login loop in production on HTTP: remove explicit `useSecureCookies: process.env.NODE_ENV === 'production'` from `withIGRPAuth` authOptions.

  When a production build (`NODE_ENV=production`) runs over HTTP (e.g. `next start` on localhost), this flag caused NextAuth to write the session cookie as `__Secure-next-auth.session-token` while the middleware's `getToken` read back `next-auth.session-token` — a name mismatch that made every authenticated request look unauthenticated, producing an infinite redirect to `/login`.

  NextAuth's own default derives `useSecureCookies` from whether `NEXTAUTH_URL` starts with `https://`, which is exactly the same signal `getToken` uses internally. Removing the override lets both sides default from the URL scheme and stay permanently in sync.

  On a real HTTPS deployment (where `NEXTAUTH_URL` starts with `https://`), secure cookie behaviour is unchanged.

## 0.1.0-beta.136

### Patch Changes

- 7a89144: Harden the OIDC refresh path and tidy two related rough edges:
  - `refreshOidcAccessToken` now retries the refresh-token grant once on a **transient** failure (network error, timeout, or 5xx) before giving up, and time-boxes the grant via `fetchWithTimeout`. A single network blip no longer forces an immediate logout. A 4xx (e.g. `invalid_grant` for a consumed/expired refresh token) is permanent and is never retried.
  - `getAccessToken` now falls back to `process.env.NEXTAUTH_SECRET` (matching `getTokenFromRequest`) instead of `''`, so the token can still be decoded when no explicit `secret` was passed to `withIGRPAuth`.
  - Removed the unreachable `token.error === 'invalid_grant'` branch in `isTokenExpiredOrFailed`; the refresh path only ever sets `error` to `'RefreshAccessTokenError'`, so that is the single failure flag checked everywhere.
  - `refreshOidcAccessToken` now caches a rotated refresh-token result in-process (keyed by the consumed token, ~180s TTL) and the jwt callback consults it via `getRecoveredToken` **before** introspection. When the IdP rotates refresh tokens, a refresh that runs in a read-only RSC render no longer orphans the rotated token: the next persist-capable read (the client session poll or a server action) recovers and persists it instead of replaying the consumed token and forcing a logout. In-memory only — multi-instance deployments without sticky sessions can still race across pods.

## 0.1.0-beta.135

### Patch Changes

- 6b42572: - Coordinated maintenance release: bump all framework packages to the next beta to keep versions aligned across the framework.

## 0.1.0-beta.134

### Patch Changes

- b88c4b1: Fix logout hanging on the "A terminar sessão…" spinner without clearing the session.
  - **next-auth (`oidc.ts`):** `events.signOut` awaits `revokeOidcSession` (and the OpenID discovery fetch before it), which blocks the `/api/auth/signout` response — and therefore the session-cookie clear — until it resolves. Those `fetch` calls had no timeout, so a slow or unreachable IdP hung sign-out indefinitely. Both the discovery and revocation requests on the sign-out critical path are now time-boxed via an `AbortController` (`IDP_FETCH_TIMEOUT_MS`), so local sign-out always completes promptly and the existing network-error handling kicks in.

## 0.1.0-beta.133

### Patch Changes

- f89e1ab: fix(auth): stop double signOut race and clear stale refresh-error from still-valid tokens
  - `useSafeSession` no longer calls `signOut()` on `RefreshAccessTokenError`.
    That responsibility was already owned by `IGRPSessionWatcher` (path-aware,
    routes to `/logout` for a clean IdP single-logout). Having both fire meant
    two concurrent `POST /api/auth/signout` calls when a layout consumer
    mounted alongside the logout page, racing the page's own end-session
    redirect and leaving the UI stuck on "A terminar sessão…". The function
    signature keeps `forceLogoutCallbackUrl` as an inert option for
    backwards-compatibility with existing call sites.
  - The `jwt` callback's still-valid early-return now clears any leftover
    `error` / `forceLogout` flags before returning. Otherwise a successful
    refresh inside a server-component tree (where `cookies()` is read-only
    and the rotated token can't be persisted) would leave the cookie token
    tagged with `RefreshAccessTokenError`; the next route-handler poll would
    see "still valid" + stale error and return it untouched, sticking the
    user in an auto-logout loop.

- ec48e46: `refreshOidcAccessToken` now deduplicates concurrent refreshes that share a refresh_token. NextAuth's jwt callback runs once per session read, so near token expiry an RSC render + a `useSession` poll + a server action can all attempt a refresh with the SAME refresh_token; with refresh-token rotation the IdP accepts the first and rejects every subsequent one with `invalid_grant`, and the last cookie write wins — logging the user out even though one refresh succeeded. Sharing the in-flight promise collapses N concurrent calls into one network round-trip and one cookie write.

  In-memory only — multi-instance deployments can still race across pods, but single-process dev (and most production traffic via sticky routing) is fully covered.

## 0.1.0-beta.132

### Patch Changes

- 12cc11b: fix(framework-next-auth): don't swallow the `onSessionExpired` redirect in `getSession`

  When a session was expired or its refresh had failed (`error: 'RefreshAccessTokenError'`), `getSession()` invoked `onSessionExpired()` (typically `redirect('/logout')`) from _inside_ a `try/catch`. `redirect()` signals via a thrown `NEXT_REDIRECT` error, so the bare `catch` swallowed it — the intended redirect was silently cancelled and a dead session stayed mounted until the next access-token-bearing request 401'd into the error boundary (surfacing as `global-error`).

  `getSession` now keeps only `serverSession()` inside the `try/catch` (where a thrown error legitimately means "no session"), and runs the expiry/refresh check plus `onSessionExpired()` afterwards so the redirect propagates as intended.

- 12cc11b: fix(oidc): introspect the refresh token instead of the access token in the refresh gate

  The jwt callback's pre-refresh introspection (`introspectOidcToken`) checked the **access token**. That gate only runs once the access token is expired or inside its refresh buffer, and an expired access token always introspects as `active: false` per RFC 7662 — so the gate forced a logout (`RefreshAccessTokenError` / `forceLogout`) exactly when a refresh should have happened, leaving silent refresh effectively non-functional.

  It now introspects the **refresh token** (`token_type_hint=refresh_token`), whose liveness actually determines whether `grant_type=refresh_token` can succeed. A live refresh token proceeds to refresh; a server-side-revoked one is correctly detected and forces logout. Introspection stays fail-open so a flaky introspection endpoint never blocks refresh.

- 12cc11b: fix(config): give middleware a small expiry grace so the client refresh can win

  `isTokenExpiredOrFailed` (used by middleware to decide the `/login` redirect) shared the 60s `TOKEN_REFRESH_BUFFER_MS` with the jwt callback's proactive refresh. That meant middleware redirected to `/login` at exactly the moment the client session poll would have refreshed the token, so navigations near expiry were bounced before any silent refresh could land.

  Middleware now uses a separate, much smaller `TOKEN_EXPIRY_GRACE_MS` (10s), so it stays lenient through the proactive-refresh window and only redirects once the access token is effectively expired — letting the client poll / focus-refetch rotate the session cookie first (and, when it can't, falling back to a silent IdP-SSO re-login via `/login`). Refresh-error tokens are still treated as expired immediately.

- cc40fef: Enable PKCE (RFC 7636, S256) and OIDC `nonce` validation on the `igrp-auth` provider in addition to the existing `state` check. PKCE protects the authorization-code exchange against code-interception even when the client_secret is confidential; `nonce` prevents id_token replay (CWE-294) given the provider already opts into `idToken: true`. The change touches only the `/authorize` → `/callback` exchange owned by NextAuth — refresh, revocation, and introspection are unaffected. Spring Authorization Server (the default IGRP IdP) accepts PKCE on confidential clients without server-side configuration. Deployments behind reverse proxies that rewrite paths between authorize and callback may observe `PKCE_ERROR`; this is the same class of failure that already affected the `state` cookie and is rooted in `NEXTAUTH_URL` / proxy stability rather than the OAuth client config.
- cc40fef: Fix `withIGRPAuth` redirect callback discarding `callbackUrl` when `NEXTAUTH_URL_INTERNAL` was set, which forced every post-login redirect to the app home. The callback now honors a safe same-origin or relative `callbackUrl` and falls back to the configured home slug only when no useful destination was provided. This restores the expected flow after a token-refresh-driven re-login: the user lands back on the page they were on, not on `/`.

## 0.1.0-beta.131

### Patch Changes

- 2a0ef32: fix(auth): close the logout race that left IdP refresh tokens unrevoked + refresh now re-issues id_token
  - **Refresh-token grant now requests `scope`**, matching `IGRP_AUTH_SCOPES` and always including `openid`. Without this, Spring Authorization Server (and other OIDC v1 servers) returns access_token + refresh_token only, leaving the original id_token in the JWT. Over the lifetime of a session, the cached id_token's `sid` claim drifts away from the current servlet session — and the IdP's `/connect/logout` endpoint then no-ops because `id_token_hint.sid` no longer matches. With `scope=openid` on refresh, the IdP re-issues a fresh id_token whose `sid` tracks the current session.
  - `revokeOidcSession` now returns a tagged result instead of throwing. Adds explicit reasons for skip (`no_refresh_token`, `no_revocation_endpoint`), and captures HTTP status + response body on non-2xx so IdP-side rejections are diagnosable.
  - `events.signOut` now **awaits** `revokeOidcSession`. NextAuth holds the `/api/auth/signout` response until revoke settles, so the browser does not navigate to the end-session URL with a still-in-flight revoke request that the navigation would abort.
  - Dev-only diagnostics: `buildEndSessionUrl` logs the built URL shape (which of `client_id`, `post_logout_redirect_uri`, `id_token_hint` were set); `refreshOidcAccessToken` warns when the IdP did not return a new id_token on refresh; `events.signOut` logs `{ hasIdToken, hasAccessToken, hasRefreshToken, authProviderId, expiresAt, error }` (booleans only — never token values). Gated behind `NODE_ENV !== 'production'`.

  Companion change in `templates/demo-v1`: `/logout` page logs the end-session URL just before navigating, and warns when no URL was built. `.env`, `.env.example`, and `README.md` document the post-logout redirect URI registration requirement and clarify scope alignment with the IdP discovery doc.

## 0.1.0-beta.130

### Patch Changes

- fix: respect NEXT_PUBLIC_BASE_PATH in login redirect URLs

  `useSafeSession` default `forceLogoutCallbackUrl` and `getLoginRedirectUrl` both
  produced URLs without the basePath when `NEXT_PUBLIC_BASE_PATH` is set, causing
  redirects to `/login` instead of `/{basePath}/login`. Both now read
  `process.env.NEXT_PUBLIC_BASE_PATH` (a build-time NEXT_PUBLIC constant) to
  prepend the basePath automatically.

## 0.1.0-beta.129

### Patch Changes

- f283926: buildEndSessionUrl no longer requires idToken to build the Keycloak end-session URL; idToken fallback in refreshOidcAccessToken now uses || to handle empty-string responses

## 0.1.0-beta.128

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions

## 0.1.0-beta.127

### Patch Changes

- 4e9ecd5: Fix expiresAt unit bug causing infinite refresh loops; change AUTH_PROVIDER default to none; add buildEndSessionUrl for RP-initiated logout; add introspectOidcToken refresh gate

## 0.1.0-beta.120

### Patch Changes

- 939446a: fix(framework-next-auth): rethrow getServerSession errors instead of swallowing them as null

## 0.1.0-beta.119

### Patch Changes

- 20a0850: useSafeSession() now calls signOut() immediately when forceLogout is detected, eliminating the need for a navigation to trigger logout after refresh failure.
- 2137c48: Auto-revoke OIDC token on logout via events.signOut callback (non-blocking)

## 0.1.0-beta.118

### Patch Changes

- Graceful error handling for invalid AUTH_PROVIDER configuration.

  **Previously:** `withIGRPAuth()` threw synchronously at module-evaluation time when `AUTH_PROVIDER` was set to an unsupported value (e.g. `autentika`). This crashed the module before React loaded and showed a raw Next.js runtime error overlay with no helpful UI.

  **Now:** `withIGRPAuth()` catches provider-resolution errors and stores them as `configError: IGRPAuthConfigError | null` on the returned instance. Errors are re-thrown lazily so App Router error boundaries can catch and render a proper diagnostic page:
  - `GET` / `POST` handlers return a `500` HTML page with the error code and message.
  - `serverSession()` / `getSession()` throw `IGRPAuthConfigError` during render — caught by the nearest `error.tsx` or `global-error.tsx`.

  **New exports** from `@igrp/framework-next-auth/config`:
  - `IGRPAuthConfigError` — typed error class (`name: 'IGRPAuthConfigError'`, `code: string`)
  - `isIGRPAuthConfigError(error)` — structural guard (works across serialisation boundaries)

- Rename provider ID from `oauth2` to `igrp-auth`.

  **Breaking changes:**
  - `AUTH_PROVIDER` now accepts `igrp-auth` or `none` only (`oauth2` is removed)
  - `AUTH_PROVIDER` defaults to `igrp-auth`
  - `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` env vars renamed to `IGRP_AUTH_CLIENT_ID`, `IGRP_AUTH_CLIENT_SECRET`, `IGRP_AUTH_ISSUER`, `IGRP_AUTH_SCOPES`
  - `OAUTH2_PROVIDER_ID` named export renamed to `IGRP_AUTH_PROVIDER_ID`
  - `AUTH_PROVIDER_IDS.OAUTH2` key renamed to `AUTH_PROVIDER_IDS.IGRP_AUTH`
  - NextAuth callback URL changes from `/api/auth/callback/oauth2` → `/api/auth/callback/igrp-auth`

  **Migration:** Update your `.env` file — replace `AUTH_PROVIDER=oauth2` with `AUTH_PROVIDER=igrp-auth`, and rename all `OAUTH2_*` vars to `IGRP_AUTH_*`. Re-register the redirect URI on your authorization server as `{NEXTAUTH_URL}/api/auth/callback/igrp-auth`.

## 0.1.0-beta.117

### Patch Changes

- 724398a: Replace Keycloak and Autentika providers with a single generic `oauth2` OIDC provider.

  **Breaking changes:**
  - `AUTH_PROVIDER` now accepts `oauth2` or `none` only (`keycloak` and `autentika` are removed)
  - `AUTH_PROVIDER` defaults to `oauth2` (previously defaulted to `keycloak`)
  - `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` env vars removed
  - `AUTENTIKA_CLIENT_ID`, `AUTENTIKA_CLIENT_SECRET`, `AUTENTIKA_HOST`, `AUTENTIKA_TENANT_NAME`, `AUTENTIKA_SCOPES` env vars removed
  - `KEYCLOAK_PROVIDER_ID` and `AUTENTIKA_PROVIDER_ID` named exports removed from all entry points

  **Migration:** Replace with `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, `OAUTH2_ISSUER`, `OAUTH2_SCOPES` (optional, defaults to `openid`). The redirect URI to register on your server is `{NEXTAUTH_URL}/api/auth/callback/oauth2`.

## 0.1.0-beta.116

### Patch Changes

- beta.116 — template migrator CLI, lock file relocation, and release tooling fixes.

  @igrp/template-migrator
  - New CLI package that automates IGRP template upgrades via `pnpm dlx @igrp/template-migrator@latest`.
  - Bundles all 6 demo-v1 migration guides (01–06) as a cumulative manifest with embedded payloads.
  - Commands: status, plan, apply (--yes / --to), list, rollback, check (CI gate).
  - Lock file moved from root `.igrpmigrations.lock.json` → `.igrpmigrations/lock.json`; backward-compat read of old path on first run.
  - Prebuild pack script cleans payload output on every run to prevent stale files.
  - tsup config: shims disabled (no \_\_dirname polyfill injection before shebang), banner removed (shebang lives in src/cli.ts line 1).

  @igrp/framework-next-template (templates/demo-v1)
  - `.igrpmigrations/lock.json` pre-seeded to mark all 6 migrations as applied.
  - `create-zip-template.ps1` updated to strip migration guides and payloads from the published zip — only `lock.json` is included so consumers start fully up-to-date.
  - `MIGRATING.md` added: end-user upgrade guide (status → plan → apply workflow).

## 0.1.0-beta.115

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-v1)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-v1/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

## 0.1.0-beta.114

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-v1)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-v1/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

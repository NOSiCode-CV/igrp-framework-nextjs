# @igrp/framework-next-auth

NextAuth.js wrapper for the IGRP Framework. Provides a single `withIGRPAuth()` factory
that configures OIDC authentication, JWT session management, token refresh, and
route-protection middleware primitives.

## Entry points

| Import path                               | Runtime               | Purpose                                                                                         |
| ----------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| `@igrp/framework-next-auth/config`        | Node + Edge           | `withIGRPAuth()` factory                                                                        |
| `@igrp/framework-next-auth/client`        | Browser               | `useSafeSession()`, `signIn`, `signOut`, `SessionProvider`                                      |
| `@igrp/framework-next-auth/server`        | Node                  | `getServerSession`                                                                              |
| `@igrp/framework-next-auth/session`       | Node + Edge + Browser | `Session` type, `hasAccessToken`                                                                |
| `@igrp/framework-next-auth/jwt`           | Node + Edge           | `JWT` type; re-exports `getToken` / `encode` / `decode` — see the cookie note below             |
| `@igrp/framework-next-auth/middleware`    | Edge                  | Re-exports NextAuth's `withAuth` — see the cookie note below                                    |
| `@igrp/framework-next-auth/oidc`          | Node                  | `refreshOidcAccessToken`, `revokeOidcSession`, `buildEndSessionUrl`                             |
| `@igrp/framework-next-auth/providers`     | Node + Edge + Browser | Provider registry helpers                                                                       |
| `@igrp/framework-next-auth/sanitize`      | Node + Edge           | URL/redirect sanitization                                                                       |
| `@igrp/framework-next-auth/claims`        | Node + Edge + Browser | `decodeIgrpClaims`, `claimsAllow`, `claimsExpired`                                              |
| `@igrp/framework-next-auth/cookies`       | Node + Edge + Browser | Auth cookie naming: `sessionCookieName`, `buildAuthCookies`, `resolveSecureCookie`              |
| `@igrp/framework-next-auth/runtime`       | Node + Edge           | `isNextControlFlowError`                                                                        |
| `@igrp/framework-next-auth/session-store` | Node + Edge           | `IGRPSessionStore`, `configureIGRPSessionStore`, `decodeIGRPSessionToken` — see "Session store" |
| `@igrp/framework-next-auth/types`         | types only            | Session/JWT module augmentation                                                                 |

The package root (`@igrp/framework-next-auth`) re-exports only the pure modules
— `session`, `providers`, `sanitize`, `runtime`, `cookies`, plus types.
`middleware`, `jwt` and `oidc` are **not** in the root barrel: importing them
from there pulled `next-auth/middleware` and the server-side token machinery
into whatever bundle touched it. Use their subpath entries.

> **`/jwt` and `/middleware` do not know the scoped cookie names.** They
> re-export NextAuth's own `getToken` and `withAuth`, which look for the stock
> `next-auth.session-token`. With cookie isolation on (the default, see
> "Cookies"), that name does not exist, so both report "no session". Prefer the
> instance's `auth.getTokenFromRequest(request)`, which resolves the right name.
> If you must use them directly, pass the names the instance built:
>
> ```ts
> getToken({ req, secret, cookieName: auth.authOptions.cookies!.sessionToken.name });
> withAuth(handler, { cookies: auth.authOptions.cookies, secret });
> ```

## Quick start

```ts
// src/lib/auth.ts
import { withIGRPAuth } from '@igrp/framework-next-auth/config';
import { redirect } from 'next/navigation';

export const auth = withIGRPAuth({
  onSessionExpired: () => redirect('/logout'),
});

// src/app/api/auth/[...nextauth]/route.ts
export const { GET, POST } = auth;

// src/middleware.ts
export const { config } = auth;
```

## Environment variables

```bash
# Required
AUTH_PROVIDER=igrp-auth          # "igrp-auth" or "none" (disables auth)
IGRP_AUTH_CLIENT_ID=my-client
IGRP_AUTH_CLIENT_SECRET=my-secret
IGRP_AUTH_ISSUER=https://your-oidc-provider.example.com/realms/my-realm
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=some-random-secret

# Optional
IGRP_AUTH_SCOPES=openid profile email   # defaults to "openid"; "openid" is always injected automatically
IGRP_PREVIEW_MODE=true                  # bypass auth for local dev (no OIDC needed)
IGRP_AUTH_DEBUG=true                    # NextAuth debug logging — OFF by default everywhere, it prints token responses

# Deployment shape
NEXT_PUBLIC_BASE_PATH=/apps/template    # scopes auth cookie names (see "Cookies" below)
NEXT_PUBLIC_IGRP_APP_HOME_SLUG=/home    # post-login landing path, relative to the app base
AUTH_TRUST_HOST=1                       # read by next-auth: derive the origin from x-forwarded-* when NEXTAUTH_URL is unset

# Logout
IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS=https://portal.example
                                        # extra origins accepted as post_logout_redirect_uri;
                                        # the app's own origin is always allowed
```

> **`NEXTAUTH_URL_INTERNAL` is no longer used by this package.** It previously
> fed post-login and login redirects, which was a bug: it names a
> _server-to-server_ origin, so in the very deployments that set it the browser
> was handed a `Location` it could not reach. Redirects now resolve against
> `NEXTAUTH_URL`, falling back to the request origin. Setting the variable is
> harmless — `next-auth` still uses it for its own server-side calls — but it no
> longer influences anything here.

> **Post-login redirects and `basePath`.** next-auth v4 hands the `redirect`
> callback a `baseUrl` that is the bare **origin** (`https://host`) — the path of
> `NEXTAUTH_URL` (your basePath and `/api/auth`) is already stripped. The default
> callback therefore re-derives the basePath from `NEXTAUTH_URL` (its path minus
> `/api/auth`), falling back to `NEXT_PUBLIC_BASE_PATH` when `NEXTAUTH_URL` has no
> path; if the two disagree it warns once and uses `NEXTAUTH_URL`. Keep them
> aligned. A relative `callbackUrl` may or may not already carry the basePath — it
> is prefixed exactly once — and a same-origin absolute URL **outside** the
> basePath is sent to the app home instead of followed.
>
> If you pass your own `callbacks.redirect` it **replaces** all of this, and you
> receive that origin-only `baseUrl`: re-add the basePath yourself and keep the
> open-redirect guards. Prefer the default.

### There is no env var for the session-poll interval

`IGRP_SESSION_REFETCH_INTERVAL` is **not read by anything**. If you have it set,
`withIGRPAuth` warns in development and you should delete it.

The fixed poll cadence is whatever the app passes as
`sessionArgs.refetchInterval`. It does not need tuning, because it is not what
drives token refresh: `IGRPSessionWatcher` (in `@igrp/framework-next-ui`)
schedules a silent `getSession()` from `session.expiresAt` and reschedules on
every rotation, so refresh timing tracks the token instead of a guess. The fixed
poll is only a backstop for cases the timer cannot cover, such as a suspended
laptop waking up — so a long interval (`demo-v1` uses 600s) is correct.

The constraint that used to live here — poll interval must stay below the 60s
proactive-refresh buffer, or refreshes only run in read-only RSC context and
cannot persist the rotated cookie — is real, and it is why the watcher exists.
It is not something you configure.

### Cookies

When `NEXT_PUBLIC_BASE_PATH` is set, every NextAuth cookie name is suffixed with
a slug derived from it, closed by a `~`
(`next-auth.session-token.apps-template~`). Without it, two IGRP apps on the
same host under `/apps/a` and `/apps/b` write the _same_ cookie name at the same
path and overwrite each other's sessions. Apps at the host root get a bare `~`
(`next-auth.session-token~`): the stock name is a prefix of every scoped name,
so a root app sharing a host with basePath apps would read their cookies as its
own chunks, fail with `Invalid Compact JWE`, and then delete all of them.

The trailing `~` is load-bearing. NextAuth reassembles chunked cookies by
collecting every name that _starts with_ the configured one, so without a
terminator an app under `/apps/hr` would swallow `/apps/hr-admin`'s cookie as if
it were one of its own chunks — and clear it on sign-out. The terminator makes
the suffix set prefix-free.

> **Upgrading:** each rename of the cookie signs every current session out
> once, and NextAuth never clears the old name (it only clears the name it is
> configured with). A basePath app sweeps its own previous names from its
> middleware with `staleAuthCookies(basePath, presentNames)` from `/cookies` —
> the template already does this — and `igrpDeleteAuthCookies()` from
> `@igrp/framework-next` removes every form on the logout path. A root-path
> app's stock-named orphan is not swept by default (it may be a live cookie of
> an older co-hosted app) — but a root app cannot scope its cookies below
> `Path=/`, so that orphan is sent to every co-hosted app on every request.
> When no stock-named app shares the host, opt in:
> `staleAuthCookies(basePath, names, { sweepStockNames: true })`. Every app on
> a shared host must be on a release with scoped names: one stock-named app
> left on the domain still reads, and deletes, everyone else's session cookie.

The `Secure` flag (and the `__Secure-` / `__Host-` prefixes) follows the same
signal `next-auth` uses: `NEXTAUTH_URL`'s scheme, else https when `VERCEL` /
`AUTH_TRUST_HOST` is set, else http.

### Session store

A NextAuth session cookie holds the access, refresh and id tokens — 3–4 KB per
app, more for a user with many permissions. Apps on one domain share the
browser's cookie jar, and a root-path app's cookie (`Path=/`) reaches every app,
so an app center plus one app already reaches the 8 KB request-header ceiling of
nginx, Apache and Tomcat (`400 Request Header Or Cookie Too Large`).

Register a store and the cookie carries only a random session id plus the
`expiresAt` / `error` / `forceLogout` claims — a few hundred bytes. The tokens
go to the store, encrypted with `NEXTAUTH_SECRET` under a separate salt.

```ts
// src/instrumentation.ts — Node runtime only, so the store's client library
// never enters the Edge middleware bundle.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { configureIGRPSessionStore } = await import('@igrp/framework-next-auth/session-store');
    const { createRedisSessionStore } = await import('./lib/session-store');
    configureIGRPSessionStore(createRedisSessionStore(process.env.IGRP_SESSION_STORE_URL!));
  }
}
```

An `IGRPSessionStore` is `get` / `set(key, value, ttlSeconds)` / `delete` over
strings, shared by every replica. `createMemorySessionStore()` is for
development and single-instance deployments only. The `sessionStore` option of
`withIGRPAuth` takes precedence over the registered store, but drags the store
into any bundle that imports the instance — middleware included.

- **Without a store** nothing changes: the codec is NextAuth's own.
- **Existing cookies** keep working and move to the store on their next write.
- **Middleware** cannot reach the store: `auth.getTokenFromRequest()` returns the
  cookie's claims, enough for `isTokenExpiredOrFailed`, with no `accessToken`.
  Read tokens server-side with `auth.getAccessToken()`; when calling `getToken`
  directly, pass `decode: decodeIGRPSessionToken`.
- **Store down:** a failed write falls back to a full cookie for that response;
  a failed read signs the user out. **Sign-out** deletes the entry.
- A refresh that fails because a concurrent request already rotated the refresh
  token does not overwrite that newer rotation in the store.

### Scopes and refresh tokens

`IGRP_AUTH_SCOPES` controls the OAuth2 `scope` parameter sent during the authorization request.
`openid` is always included automatically — you cannot accidentally omit it.

**Token refresh requires `offline_access`.**
The framework calls `refreshOidcAccessToken` to silently renew expired access tokens.
For this to work the IdP must issue a `refresh_token`, which most providers only do when
`offline_access` is requested:

```bash
IGRP_AUTH_SCOPES=openid profile email offline_access
```

Without `offline_access`, the refresh call will have no `refresh_token` to use and the
session will be marked with `error: "RefreshAccessTokenError"` + `forceLogout: true`,
causing the client to sign the user out. This is safe behaviour, but avoidable.

> **Note:** Some providers (e.g. WSO2IS) issue refresh tokens by default regardless of
> `offline_access`. Check your provider's documentation.

### Client authentication at the IdP

Every call this package makes with the client credentials — the refresh grant,
revocation and introspection — authenticates with **HTTP Basic**
(`client_secret_basic`), the one method RFC 6749 requires every authorization
server to accept. The client registered at the IdP must allow it. Nothing is
sent as `client_secret_post`.

The lifetime of a refreshed access token is taken from the response's
`expires_in`, else from the token's own `exp`, else a 5-minute self-correcting
guess — the same order sign-in uses.

## `withIGRPAuth` options

`provider` accepts `'igrp-auth'`, `'none'` or a full NextAuth provider object,
and when given it **overrides** `AUTH_PROVIDER` everywhere — the handlers, the
middleware primitives (`isAuthDisabled()`) and the id stamped on the token
agree by construction. Beyond `provider`, `env`, `secret`, `pages`, `session`
and `callbacks`:

| Option                | Default               | Purpose                                                                                                                                                                                                                                                                                                                      |
| --------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onSessionExpired`    | —                     | Called by `getSession()` when the token is expired or refresh failed. Typically `() => redirect('/logout')`.                                                                                                                                                                                                                 |
| `middleware.loginUrl` | `/login`              | Path `getLoginRedirectUrl()` resolves.                                                                                                                                                                                                                                                                                       |
| `middleware.matcher`  | see `DEFAULT_MATCHER` | Matcher re-exported as `auth.config`. Matchers are basePath-_relative_. The default skips `/apps`, `/_next`, `favicon.ico` as whole segments and static-asset extensions (`.png`, `.css`, `.woff2`, …) — not every path with a dot, so `/users/john.doe` is protected.                                                       |
| `debug`               | `IGRP_AUTH_DEBUG`     | NextAuth debug logging. Off by default in every environment because it prints OAuth token responses.                                                                                                                                                                                                                         |
| `tokenRecoveryStore`  | in-memory             | Shared store for rotated-refresh-token recovery. Supply a cross-replica implementation for multi-pod deployments without sticky routing; the default is per-process. Keys and values are plaintext refresh/access/id tokens — treat the backing store like the session cookie (encrypt at rest, restrict access, never log). |
| `cookieIsolation`     | `'basePath'`          | `'none'` keeps NextAuth's stock cookie names. Only safe when no other IGRP app shares the host.                                                                                                                                                                                                                              |
| `sessionStore`        | registered / none     | Server-side token store — see "Session store". Prefer `configureIGRPSessionStore` from `instrumentation.ts`.                                                                                                                                                                                                                 |
| `secureCookies`       | derived               | Overrides the `Secure` flag derivation described above.                                                                                                                                                                                                                                                                      |

### Middleware primitives

`auth` exposes the pieces a template's `middleware.ts` needs, so the middleware
body stays yours:

| Member                                 | Purpose                                                                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isAuthDisabled()` / `isPreviewMode()` | Bypass checks.                                                                                                                                                                          |
| `getTokenFromRequest(request)`         | Decodes the session JWT from an Edge request.                                                                                                                                           |
| `isTokenExpiredOrFailed(token)`        | Expiry + refresh-error check, with the middleware grace window.                                                                                                                         |
| `resolveAppUrl(path, request)`         | Resolves a path against the app's **browser-reachable** origin. Use this instead of `new URL(path, request.url)` — behind a TLS-terminating proxy `request.url` is the internal origin. |
| `getLoginRedirectUrl(request)`         | `resolveAppUrl` applied to `middleware.loginUrl`.                                                                                                                                       |
| `config`                               | `{ matcher }` for re-export.                                                                                                                                                            |

## Supported providers

| `AUTH_PROVIDER` value | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| `igrp-auth` (default) | Generic OIDC — works with Keycloak, WSO2IS, or any OIDC-compliant provider |
| `none`                | Disables authentication entirely — must be set **explicitly**              |

An **absent** `AUTH_PROVIDER` resolves to `igrp-auth`, so an unconfigured app
fails closed with the configuration-error page rather than serving
unauthenticated traffic. In production that page shows only the error code
(the detail, which names the missing variables, goes to the server log); in
development it shows the full message.

A throwing `callbacks.jwt` / `callbacks.session` extension does **not** end the
session: next-auth would clear the cookie on such a throw, so the IGRP value is
used instead and the failure is logged with the extension's name. An **empty** `AUTH_PROVIDER=` is refused outright
(`AUTH_PROVIDER_EMPTY`) instead of being treated as absent — defaulting it could
silently switch authentication off.

### Custom providers

Passing a provider object (`provider: GitHubProvider({ ... })`) is supported, but
that provider is **not managed** by this package: it has no IGRP issuer,
discovery document or client credentials, so refresh, introspection, revocation
and RP-initiated logout all no-op for it, and no access-token expiry is stamped
on the session. Its lifetime is the NextAuth session cookie, and its token
lifecycle is the application's responsibility.

The OIDC callback URL to register on your provider is:
`{NEXTAUTH_URL}/api/auth/callback/igrp-auth`

## Session shape

```ts
import type { Session } from 'next-auth';

// Augmented fields (from @igrp/framework-next-auth/types):
session.accessToken; // OIDC access token
session.idToken; // OIDC ID token
session.authProviderId; // "igrp-auth" | "none" | a custom provider's own id
session.expiresAt; // Unix ms when access token expires
session.error; // "RefreshAccessTokenError" on failed refresh
session.forceLogout; // true when refresh has failed — client should signOut()
```

## License

MIT

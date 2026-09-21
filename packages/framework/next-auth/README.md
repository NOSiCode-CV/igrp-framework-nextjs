# @igrp/framework-next-auth

NextAuth.js wrapper for the IGRP Framework. Provides a single `withIGRPAuth()` factory
that configures OIDC authentication, JWT session management, token refresh, and
route-protection middleware primitives.

## Entry points

| Import path                            | Runtime               | Purpose                                                                            |
| -------------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `@igrp/framework-next-auth/config`     | Node + Edge           | `withIGRPAuth()` factory                                                           |
| `@igrp/framework-next-auth/client`     | Browser               | `useSafeSession()`, `signIn`, `signOut`, `SessionProvider`                         |
| `@igrp/framework-next-auth/server`     | Node                  | `getServerSession`                                                                 |
| `@igrp/framework-next-auth/session`    | Node                  | Session types                                                                      |
| `@igrp/framework-next-auth/jwt`        | Node                  | JWT types                                                                          |
| `@igrp/framework-next-auth/middleware` | Edge                  | NextAuth middleware                                                                |
| `@igrp/framework-next-auth/oidc`       | Node                  | `refreshOidcAccessToken`, `revokeOidcSession`                                      |
| `@igrp/framework-next-auth/providers`  | Node                  | Provider registry helpers                                                          |
| `@igrp/framework-next-auth/sanitize`   | Node + Edge           | URL/redirect sanitization                                                          |
| `@igrp/framework-next-auth/claims`     | Node + Edge + Browser | `decodeIgrpClaims`, `claimsAllow`, `claimsExpired`                                 |
| `@igrp/framework-next-auth/cookies`    | Node + Edge + Browser | Auth cookie naming: `sessionCookieName`, `buildAuthCookies`, `resolveSecureCookie` |
| `@igrp/framework-next-auth/runtime`    | Node + Edge           | `isNextControlFlowError`                                                           |
| `@igrp/framework-next-auth/types`      | types only            | Session/JWT module augmentation                                                    |

The package root (`@igrp/framework-next-auth`) re-exports only the pure modules
— `session`, `providers`, `sanitize`, plus types. `middleware`, `jwt` and `oidc`
are **not** in the root barrel: importing them from there pulled
`next-auth/middleware` and the server-side token machinery into whatever bundle
touched it. Use their subpath entries.

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

# Deployment shape
NEXT_PUBLIC_BASE_PATH=/apps/template    # scopes auth cookie names (see "Cookies" below)
NEXT_PUBLIC_IGRP_APP_HOME_SLUG=/home    # post-login landing path, relative to the app base
AUTH_TRUST_HOST=1                       # read by next-auth: derive the origin from x-forwarded-* when NEXTAUTH_URL is unset

# Session lifecycle
IGRP_SESSION_REFETCH_INTERVAL=45        # client session-poll seconds; MUST stay below 60 (see below)

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

### `IGRP_SESSION_REFETCH_INTERVAL` has a hard ceiling

The `jwt` callback only refreshes once the access token is within **60s** of
expiry. A poll interval at or above that never lands inside the refresh window,
so the only refreshes that run happen during RSC renders, where `cookies()` is
read-only and the rotated token cannot be persisted — the session then dies in a
gap users experience as a random bounce to `/login`. `withIGRPAuth` warns in
development when the value is 60 or above. 45 leaves margin for jitter.

### Cookies

When `NEXT_PUBLIC_BASE_PATH` is set, every NextAuth cookie name is suffixed with
a slug derived from it, closed by a `~`
(`next-auth.session-token.apps-template~`). Without it, two IGRP apps on the
same host under `/apps/a` and `/apps/b` write the _same_ cookie name at the same
path and overwrite each other's sessions. Apps at the host root keep the stock
names.

The trailing `~` is load-bearing. NextAuth reassembles chunked cookies by
collecting every name that _starts with_ the configured one, so without a
terminator an app under `/apps/hr` would swallow `/apps/hr-admin`'s cookie as if
it were one of its own chunks — and clear it on sign-out. The terminator makes
the suffix set prefix-free.

> **Upgrading:** the `~` renames the cookie, so every current session under a
> basePath is signed out once. The pre-rename cookie is not cleared
> automatically (NextAuth only clears names matching the one it is configured
> with) and lingers until it expires. To sweep it, call
> `igrpDeleteAuthCookies()` from `@igrp/framework-next` — it matches by
> basename, so it removes both the old and new forms.

The `Secure` flag (and the `__Secure-` / `__Host-` prefixes) follows the same
signal `next-auth` uses: `NEXTAUTH_URL`'s scheme, else https when `VERCEL` /
`AUTH_TRUST_HOST` is set, else http.

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

## `withIGRPAuth` options

Beyond `provider`, `env`, `secret`, `pages`, `session` and `callbacks`:

| Option                | Default               | Purpose                                                                                                                                                              |
| --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onSessionExpired`    | —                     | Called by `getSession()` when the token is expired or refresh failed. Typically `() => redirect('/logout')`.                                                         |
| `middleware.loginUrl` | `/login`              | Path `getLoginRedirectUrl()` resolves.                                                                                                                               |
| `middleware.matcher`  | see `DEFAULT_MATCHER` | Matcher re-exported as `auth.config`. Matchers are basePath-_relative_.                                                                                              |
| `tokenRecoveryStore`  | in-memory             | Shared store for rotated-refresh-token recovery. Supply a cross-replica implementation for multi-pod deployments without sticky routing; the default is per-process. |
| `cookieIsolation`     | `'basePath'`          | `'none'` keeps NextAuth's stock cookie names. Only has an effect when a basePath is set.                                                                             |
| `secureCookies`       | derived               | Overrides the `Secure` flag derivation described above.                                                                                                              |

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
unauthenticated traffic. An **empty** `AUTH_PROVIDER=` is refused outright
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

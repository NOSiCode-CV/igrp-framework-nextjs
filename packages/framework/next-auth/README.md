# @igrp/framework-next-auth

NextAuth.js wrapper for the IGRP Framework. Provides a single `withIGRPAuth()` factory
that configures OIDC authentication, JWT session management, token refresh, and
route-protection middleware primitives.

## Entry points

| Import path | Runtime | Purpose |
|---|---|---|
| `@igrp/framework-next-auth/config` | Node + Edge | `withIGRPAuth()` factory |
| `@igrp/framework-next-auth/client` | Browser | `useSafeSession()`, `signIn`, `signOut`, `SessionProvider` |
| `@igrp/framework-next-auth/server` | Node | `getServerSession` |
| `@igrp/framework-next-auth/session` | Node | Session types |
| `@igrp/framework-next-auth/jwt` | Node | JWT types |
| `@igrp/framework-next-auth/middleware` | Edge | NextAuth middleware |
| `@igrp/framework-next-auth/oidc` | Node | `refreshOidcAccessToken`, `revokeOidcSession` |
| `@igrp/framework-next-auth/providers` | Node | Provider registry helpers |
| `@igrp/framework-next-auth/sanitize` | Node + Edge | URL/redirect sanitization |
| `@igrp/framework-next-auth/types` | types only | Session/JWT module augmentation |

## Quick start

```ts
// src/lib/auth.ts
import { withIGRPAuth } from "@igrp/framework-next-auth/config";
import { redirect } from "next/navigation";

export const auth = withIGRPAuth({
  onSessionExpired: () => redirect("/logout"),
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
IGRP_AUTH_SCOPES=openid profile email   # defaults to "openid"
NEXTAUTH_URL_INTERNAL=http://app:3000   # internal URL for server-to-server calls
IGRP_PREVIEW_MODE=true                  # bypass auth for local dev (no OIDC needed)
```

## Supported providers

| `AUTH_PROVIDER` value | Description |
|---|---|
| `igrp-auth` (default) | Generic OIDC — works with Keycloak, WSO2IS, or any OIDC-compliant provider |
| `none` | Disables authentication entirely |

The OIDC callback URL to register on your provider is:
`{NEXTAUTH_URL}/api/auth/callback/igrp-auth`

## Session shape

```ts
import type { Session } from "next-auth";

// Augmented fields (from @igrp/framework-next-auth/types):
session.accessToken    // OIDC access token
session.idToken        // OIDC ID token
session.authProviderId // "igrp-auth" | "none"
session.expiresAt      // Unix ms when access token expires
session.error          // "RefreshAccessTokenError" on failed refresh
session.forceLogout    // true when refresh has failed — client should signOut()
```

## License

MIT

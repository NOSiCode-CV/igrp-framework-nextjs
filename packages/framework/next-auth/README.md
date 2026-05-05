# @igrp/framework-next-auth

NextAuth.js wrappers for the IGRP Framework — OIDC provider configuration, JWT/session helpers, edge-safe middleware, and server/client entry points that keep auth code out of client bundles.

## Requirements

- **Node.js** ≥ 20.x
- **Next.js** ^15.5.15
- **next-auth** ^4.24.14
- **React** ^19.2.5

---

## Installation

```bash
pnpm add @igrp/framework-next-auth
```

---

## Entry points

Each subpath is a separate bundle — import only what a given file needs so server-only code never leaks into client bundles.

| Entry | Use in | What it provides |
| ----- | ------ | ---------------- |
| `@igrp/framework-next-auth` | server | Root barrel (session + JWT + middleware + providers) |
| `@igrp/framework-next-auth/server` | server | Server-side auth helpers, `auth()`, `signIn`, `signOut` |
| `@igrp/framework-next-auth/client` | client | `useSession`, `SessionProvider`, `signIn`, `signOut` |
| `@igrp/framework-next-auth/session` | server / client | Typed session accessors |
| `@igrp/framework-next-auth/jwt` | server | JWT decode / validation helpers |
| `@igrp/framework-next-auth/middleware` | edge (middleware) | `isAuthBypass`, matcher config, edge-safe auth check |
| `@igrp/framework-next-auth/config` | server | NextAuth option builders |
| `@igrp/framework-next-auth/oidc` | server | OIDC discovery + token introspection helpers |
| `@igrp/framework-next-auth/providers` | server | Pre-configured Keycloak and Autentika providers |
| `@igrp/framework-next-auth/sanitize` | server | Token sanitization utilities |
| `@igrp/framework-next-auth/types` | anywhere | Shared TypeScript types |

Never import from `@igrp/framework-next-auth/dist/...` — use the subpath entries above.

---

## Usage

### Auth providers

Two OIDC providers are pre-configured: **Keycloak** and **Autentika** (WSO2IS). Select one with the `AUTH_PROVIDER` environment variable.

```ts
// src/lib/auth.ts
import { getAuthConfig } from "@igrp/framework-next-auth/config"

export const { handlers, auth, signIn, signOut } = getAuthConfig()
```

#### Required environment variables

**Common:**

```env
AUTH_PROVIDER=keycloak   # keycloak | autentika
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...      # openssl rand -base64 32
NEXTAUTH_URL_INTERNAL=http://localhost:3000
```

**Keycloak:**

```env
KEYCLOAK_CLIENT_ID=my-client
KEYCLOAK_CLIENT_SECRET=...
KEYCLOAK_ISSUER=https://keycloak.example.com/realms/my-realm
```

**Autentika (WSO2IS):**

```env
AUTENTIKA_CLIENT_ID=my-client
AUTENTIKA_CLIENT_SECRET=...
AUTENTIKA_HOST=https://autentika.example.com
AUTENTIKA_TENANT_NAME=carbon.super
AUTENTIKA_SCOPES=openid internal_login
```

### Middleware (edge)

```ts
// src/middleware.ts
import { isAuthBypass, authMiddlewareConfig } from "@igrp/framework-next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  if (isAuthBypass(request)) return NextResponse.next()
  // ... JWT validation
}

export const config = authMiddlewareConfig
```

### Session (server component)

```ts
import { getServerSession } from "@igrp/framework-next-auth/session"

export default async function Page() {
  const session = await getServerSession()
  // session.user.name, session.user.email, ...
}
```

### Client session

```tsx
"use client"
import { useSession } from "@igrp/framework-next-auth/client"

export function UserMenu() {
  const { data: session } = useSession()
  return <span>{session?.user?.name}</span>
}
```

---

## Build

```bash
# From repo root
pnpm build:auth

# From package directory
pnpm build
```

Built with **tsup** (no React Compiler step). Output in `dist/`.

---

## License

MIT © IGRP Labs

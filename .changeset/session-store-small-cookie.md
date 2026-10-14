---
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
---

Add an optional server-side session store, so the session cookie stays a few hundred bytes instead of 3–4 KB.

Apps on one domain share the browser's cookie jar, and a root-path app's cookie (`Path=/`) reaches every app. An app center plus one app pushed the `Cookie` header past nginx's default 8 KB, and the ingress answered `400 Request Header Or Cookie Too Large` for the whole domain (`demoigrp.nosi.cv`, 2026-10-13).

- New entry `@igrp/framework-next-auth/session-store`: the `IGRPSessionStore` interface, `configureIGRPSessionStore` (register from `instrumentation.ts`, Node runtime only), `createMemorySessionStore`, and `decodeIGRPSessionToken` for direct `getToken` calls. `withIGRPAuth` also accepts a `sessionStore` option.
- With a store, the cookie holds a random session id plus `expiresAt` / `error` / `forceLogout`. The tokens are stored encrypted with `NEXTAUTH_SECRET`. Sign-out deletes the entry. A failed refresh does not overwrite a concurrent successful rotation.
- Without a store nothing changes. Existing cookies keep working and move to the store on their next write, so nobody is signed out.
- `auth.getTokenFromRequest()` (middleware) returns no `accessToken` once a store is in use; read tokens server-side.
- `@igrp/framework-next`: the access-token fallback that reads the session cookie directly now decodes through the store.

---
"@igrp/framework-next-auth": patch
---

Fix login loop in production on HTTP: remove explicit `useSecureCookies: process.env.NODE_ENV === 'production'` from `withIGRPAuth` authOptions.

When a production build (`NODE_ENV=production`) runs over HTTP (e.g. `next start` on localhost), this flag caused NextAuth to write the session cookie as `__Secure-next-auth.session-token` while the middleware's `getToken` read back `next-auth.session-token` — a name mismatch that made every authenticated request look unauthenticated, producing an infinite redirect to `/login`.

NextAuth's own default derives `useSecureCookies` from whether `NEXTAUTH_URL` starts with `https://`, which is exactly the same signal `getToken` uses internally. Removing the override lets both sides default from the URL scheme and stay permanently in sync.

On a real HTTPS deployment (where `NEXTAUTH_URL` starts with `https://`), secure cookie behaviour is unchanged.

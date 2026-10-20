---
"@igrp/framework-next-auth": patch
---

Never present a refresh token the IdP may already have consumed.

Access Management rotates refresh tokens and keeps a durable record of every rotated-out one: presenting one again, at any time, revokes the session. Two frontend paths could do that.

**Refresh lock (session store).** With several replicas, two concurrent requests for the same session could each spend the same refresh token.

- `IGRPSessionStore` gains optional `acquireLock(key, owner, ttlMs)` / `releaseLock(key, owner)`. On Redis: `SET NX PX`, plus a compare-and-delete script to release. `createMemorySessionStore` implements both.
- New `refreshUnderSessionLock`, keyed on the session id. The jwt callback now runs introspection and refresh under it. Introspection is inside the lock because introspecting a refresh token another replica just rotated reads as inactive and force-logs-out.
- The winner re-reads the store, refreshes, and writes the result before releasing.
- A waiter never refreshes while the lock is held. A dead holder's lock expires (20 s) and the waiter takes it over. If the holder is merely slow, the waiter returns the session unchanged for that request, without an error flag, and the next read retries.
- Without lock methods or without a store, refresh runs as before. If taking the lock fails because the store is down, the refresh also runs without it.

**Refresh retry.** The refresh-token call was retried on timeout and on any 5xx. Those outcomes are ambiguous: the IdP may have rotated the token and only the reply was lost, so the retry replayed a spent token and revoked the session. It now retries only when the request provably never reached the IdP (`ECONNREFUSED`, `ENOTFOUND`, `EAI_AGAIN`, connect timeout) or the IdP answered 503. The refresh call's own timeout is 8 s (was 4 s), so a slow but successful refresh is not cut off into an ambiguous failure.

Docs: the README "Cookies" section now describes the current names and paths (`.<slug>_p~` at `Path=<basePath>`). `auth.config` is no longer documented as something to re-export from `middleware.ts`: Next parses the middleware `config` at build time, ignores a re-export, and then runs the middleware on every path.

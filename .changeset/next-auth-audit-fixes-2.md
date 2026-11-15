---
'@igrp/framework-next-auth': patch
---

`isNextControlFlowError` now counts a `digest` only when it starts with one of Next's own codes (`NEXT_REDIRECT`, `NEXT_HTTP_ERROR_FALLBACK`, `DYNAMIC_SERVER_USAGE`, …). An application error with a digest, such as framework-next's `AppError`, thrown from a `callbacks.jwt` extension no longer gets rethrown and no longer clears the session. The README's `getToken` recipe now passes `decode: decodeIGRPSessionToken`, and says `withAuth` is unsupported with a session store. Build docs now name tsdown, and the unused `splitting` option is gone.

`getSession` no longer logs out a session whose access token is still valid but inside the 60 s refresh window: it now uses the middleware rule (expired, or 10 s from expiry). Before, a token with 50 s left plus one failed discovery fetch during refresh sent the user to `/logout`. `isNextControlFlowError` also recognises Next 15's static-generation bailout, which sets `code: 'NEXT_STATIC_GEN_BAILOUT'` and keeps `name` as `Error`. The OIDC discovery timeout now also covers reading the response body, so a proxy that stalls the body no longer hangs every refresh on the pod for the 5-minute cache lifetime.

The token-endpoint response body is also read under a timeout: a body that stalls after the headers now ends the refresh as failed (never retried, since the token may already be spent) instead of hanging it.

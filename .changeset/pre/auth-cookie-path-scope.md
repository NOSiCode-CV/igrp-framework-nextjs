---
"@igrp/framework-next-auth": patch
"@igrp/framework-next": patch
---

Fix RP-initiated logout failing on hosts that serve several apps (and the IdP) under one domain. Auth cookies were scoped by name but all set at `Path=/`, so every request to the host — including the IdP's end-session GET, which also carries the id_token in its URL — sent every app's 2–4 KB, chunked session cookie. That tipped the request over the proxy's header limit (`431`, or `ERR_HTTP2_PROTOCOL_ERROR` over HTTP/2), the IdP session survived, and the user stayed signed in until the cookies were cleared by hand.

- `buildAuthCookies` now confines the session, callback-url, PKCE, state and nonce cookies to the app's basePath (`basePathCookiePath`), so each app's cookies reach only its own routes. The CSRF cookie stays at `Path=/` under its previous name (`__Host-` requires it).
- Those cookies are renamed once, from `.<slug>~` to `.<slug>_p~` (`authCookieSuffix`), so the old `Path=/` copy and the new one can never be read as the same cookie. Root-path apps are unchanged: same path, same names.
- New `staleAuthCookies(basePath, presentNames)` returns this app's previous-generation cookie names (never another app's) with the options that expire them; the template middleware applies it on every response.
- `igrpDeleteAuthCookies()` now expires each cookie at the path it was set at — the basePath for current path-scoped cookies, `/` for older ones — and sets `Secure` for `__Secure-` names, without which the browser ignores the deletion.

⚠️ Deploy note: users of basePath apps are signed out once (with auto sign-in on `/login` the SSO round-trip makes this invisible). Existing apps need the template middleware change (`expireStaleAuthCookies`) to sweep the old cookies; until then they expire on their own (30 days by default). Raising the proxy's header buffer is still advisable as headroom.

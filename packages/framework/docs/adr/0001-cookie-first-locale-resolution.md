# Locale is resolved cookie-first, never from the URL

IGRP apps localise with next-intl but carry no `[locale]` URL segment: every generated app sits under a `basePath` behind the platform's auth redirects, and a locale segment would multiply routes, callback URLs and migrations for no user-facing gain. The locale for a request is resolved as: the `IGRP_LOCALE` cookie, then the identity provider's session locale, then `Accept-Language`, then the app's default locale. The cookie is written only by an explicit `setLocale`, so it always means "the user chose this" — the session locale is read directly and never copied into it.

## Considered Options

- **Session locale first.** Rejected: without a write-back endpoint the locale switcher cannot override it, and tokens keep a stale locale until refreshed.
- **Seed the cookie from the session in middleware.** Rejected: a seeded value is indistinguishable from a choice, so on a shared browser the previous user's locale sticks to the next one; it also needs the token on middleware branches (bypass, public paths) that return before reading it.

## Consequences

- An explicit choice outlives sign-out and applies to every IGRP app on the same host (cookie path `/`).
- A locale changed at the identity provider only takes effect for users who never chose one in the browser.

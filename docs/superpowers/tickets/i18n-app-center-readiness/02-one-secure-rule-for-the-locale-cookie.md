# 02: One `Secure` rule for the locale cookie

**What to build:** Behind the platform gateway (TLS terminated, app reached over HTTP), the `IGRP_LOCALE` cookie is `Secure` whether the language switcher action wrote it or middleware synced it. Local HTTP development still gets a non-`Secure` cookie. Both writers use one exported Edge-safe helper, so their rules can't drift apart again.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-app-center-readiness-spec.md` (stories 7–10) · **Plan:** Task 2

- [ ] `igrpIsSecureRequest(headers, fallbackProtocol?)` is exported from `@igrp/framework-next/i18n` and stays Edge-safe.
- [ ] The helper decides in order: the first `x-forwarded-proto` value, then the fallback protocol, then `origin`.
- [ ] `x-forwarded-proto: https,http` counts as secure.
- [ ] A header saying `http` overrides an `https:` fallback.
- [ ] No headers and no fallback counts as not secure.
- [ ] Middleware cookie sync on a request to `http://…` with `x-forwarded-proto: https` writes a `Secure` cookie.
- [ ] The existing set-locale behaviour and its tests are unchanged.
- [ ] A changeset marks `@igrp/framework-next` as a patch.

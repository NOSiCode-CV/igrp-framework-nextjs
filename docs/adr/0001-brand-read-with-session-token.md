# 0001. Read the organization Brand with the user's session token and a process cache

- Status: accepted
- Date: 2026-10-13
- Scope: `@igrp/framework-next`, `@igrp/framework-next-ui`, `@igrp/framework-next-types`
- Related: Application Center ADR `0003-brand-read-with-session-token.md`, design spec `2026-10-13-platform-branding-design.md`

## Context

The organization Brand (colors and logos) is stored in Access Management as a
global configuration of type `ORGANIZATION`. Every framework app that opts in
must read it at render time, before first paint, including on login and invite
pages that have no user session.

The natural machine credential is the client-credentials (M2M) token that the
framework already uses for startup sync. Access Management rejects that token on
any path outside `/api/m2m/**` (`M2MTokenRejectionFilter`), and
`GET /api/global-configuration` is outside that prefix.

## Decision

1. The loader reads the Brand with the signed-in user's access token, the same
   token used for every other request from that user.
2. Results are cached per process for five minutes, with stale-while-revalidate,
   concurrent-request de-duplication, and a 60-second cooldown after errors.
3. A missing Brand (404) is cached as "no Brand" for the same TTL.
4. The token source is a single function, `resolveBrandingToken`, so the read
   can move to an M2M provider without touching callers.
5. Public pages read the cache only and never fetch without a token.

## Alternatives considered

- **M2M token for every read.** Cleanest for cold-start login pages, but blocked
  by the backend filter. Rejected until the backend adds an `/api/m2m/` read
  endpoint or an allowlist entry.
- **Public, unauthenticated GET.** Simplest, but exposes the organization's
  configuration to anyone and needs a backend change. Rejected.
- **Build-time or deploy-time config.** No runtime edits, so the editor would be
  useless. Rejected.
- **Fetch on every request.** Always fresh, but adds an API call to every page
  in every app. Rejected in favour of the TTL and the freshness cookie.

## Consequences

- Login pages show the Brand only when the process has already warmed the cache
  with a signed-in request. Cold starts show the Defaults until the first sign-in.
- A signed-in request on a cold process waits up to three seconds for the fetch,
  once per TTL.
- Switching to an M2M read later changes one function and removes the cold-start
  gap. The backend change is tracked in the Application Center.
- Access Management must accept user tokens on the GET for every user who can
  reach an app, which it does today.

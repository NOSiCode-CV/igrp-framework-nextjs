---
'@igrp/framework-next': patch
---

feat(next)!: OAuth2 `client_credentials` for AM sync + fail-fast config validation

The Access Management startup sync now authenticates to the AM API using OAuth2 `client_credentials` instead of a static M2M token. Three structural improvements ride along:

- **Single shared `AccessManagementClient` per process** (`lib/sync-client.ts`) keyed by `${baseUrl}|${clientId}`. Previously each sync phase (application/routes/menus) built its own client, defeating the token cache. Now one OAuth2 token is fetched per process lifetime and shared across all three phases.
- **Validation at render time** (`lib/sync-plan.ts`). `planAccessManagementSync` runs synchronously inside `IGRPRootLayout` and throws `IgrpConfigError('IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING')` when required env vars are missing or malformed (whitespace, invalid identifier shape). Misconfigured environments now fail with a clear error in `global-error.tsx` on the first request, instead of an opaque 4xx from the AM server buried in a post-stream `console.error`.
- **`igrpStartupSync` is a pure executor.** Takes a pre-validated plan; never inspects env vars; can't throw `IgrpConfigError`. Network/runtime errors are caught, logged as structured JSON (`event: 'igrp.am.sync_failed'`, never logging credentials), and the per-process mutex resets so the next request can retry.
- **Preview-mode interlock.** When `IGRP_PREVIEW_MODE=true` and `IGRP_SYNC_ACCESS=true` are both set (almost always a developer-config slip), the framework emits a `console.warn` and skips sync.

**Breaking** (consumed via `@igrp/framework-next-types` `apiManagementConfig` shape change):
- `m2mToken` removed → use `m2mClientId` + `m2mClientSecret`.
- `m2mServiceId` renamed → `serviceId`.
- `syncOnCodeMenus` removed (was dead config).

Internal modules `sync-application`, `sync-routes`, `sync-menus` now accept a shared `client` arg instead of building their own; their signatures changed but they're not part of the public API.

All sync modules now `import 'server-only'` for compile-time defense against accidental client-bundle inclusion.

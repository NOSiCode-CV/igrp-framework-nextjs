# Autentika Provider Reference

## Goal

Implement an `AutentikaProvider` for NextAuth in `igrp-framework-nextjs`, modeled after the existing Keycloak-based setup, but aligned with WSO2IS-compatible OIDC metadata.

## Requirements

- Export a provider with id `autentika`
- Export the provider id constant from the framework library
- Keep provider selection dynamic and registry-based
- Allow consuming apps to select the active provider through environment variables
- Avoid provider-choice branching with `if/else`

## Environment Variables

Required when active provider is `autentika`:

- `AUTH_PROVIDER=autentika`
- `AUTENTIKA_CLIENT_ID`
- `AUTENTIKA_CLIENT_SECRET`
- `AUTENTIKA_HOST`
- `AUTENTIKA_TENANT_NAME`

Optional:

- `AUTENTIKA_SCOPES`

Default scopes:

- `openid internal_login`

## Discovery URL

Use the WSO2IS-compatible discovery URL:

```text
{AUTENTIKA_HOST}/t/{AUTENTIKA_TENANT_NAME}/oauth2/token/.well-known/openid-configuration
```

## Provider Shape

The provider should:

- be `type: "oauth"`
- use `wellKnown` with the Autentika discovery URL
- set `authorization.params.scope`
- map the user profile using `sub` as the stable id

## Expected Framework Exports

Expose these from `@igrp/framework-next-auth` or `@igrp/framework-next-auth/client` as appropriate:

- `AUTENTIKA_PROVIDER_ID`
- `KEYCLOAK_PROVIDER_ID`
- `AUTH_PROVIDER_IDS`
- `AuthProviderId`
- `getAuthProviderIdFromEnv`
- `createAuthProviderFromEnv`
- `getMissingAuthProviderEnvVars`

## Dynamic Multi-Provider Pattern

Use a registry object keyed by provider id:

```ts
const AUTH_PROVIDER_REGISTRY = {
  keycloak: { ... },
  autentika: { ... },
} as const;
```

Then resolve the active provider by key lookup, not by `if/else`.

## Consumer Integration

Consumers should:

- import provider helpers from the framework library
- build `authOptions.providers` from `createAuthProviderFromEnv(process.env)`
- use the exported provider id constant for `signIn`
- validate only the environment variables required by the active provider

## Templates To Update

- `templates/demo`
- `templates/demo-legacy`

## Downstream Consumer To Update

- `igrp-application-center`

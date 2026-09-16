// Root barrel — deliberately limited to the pure, dependency-free modules.
//
// `./session`, `./providers` and `./sanitize` import nothing but types, so a
// consumer that reaches for `getAuthProviderIdFromEnv` or `sanitizeRedirectUrl`
// from a page pays nothing at runtime.
//
// `./middleware`, `./jwt` and `./oidc` are NOT re-exported here: the first two
// pull `next-auth/middleware` / `next-auth/jwt` into whatever bundle touches
// the barrel, and `./oidc` is the server-side token machinery (refresh,
// revocation, introspection, the recovery store). Previously a single
// `import { getAuthProviderIdFromEnv } from '@igrp/framework-next-auth'` in a
// login page dragged all three into that page's graph. Import them from their
// dedicated subpath entries — which is also what this package's own rule says:
// "New symbols go behind the right entry, not the root barrel."
export * from './session';
export * from './providers';
export * from './sanitize';

// Types only — erased at build time, so they cost nothing at runtime and stay
// importable from the root for convenience.
export type { JWT } from './jwt';
export type { RevokeOidcSessionResult } from './oidc';
export type { IGRPTokenRecoveryStore } from './token-store';

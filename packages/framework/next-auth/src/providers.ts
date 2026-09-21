import type { OAuthConfig } from 'next-auth/providers/oauth';

import { warnOnce } from './_global-state';

export const IGRP_AUTH_PROVIDER_ID = 'igrp-auth' as const;
export const NONE_PROVIDER_ID = 'none' as const;

export const AUTH_PROVIDER_IDS = {
  IGRP_AUTH: IGRP_AUTH_PROVIDER_ID,
  NONE: NONE_PROVIDER_ID,
} as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[keyof typeof AUTH_PROVIDER_IDS];

/**
 * What `token.authProviderId` / `session.authProviderId` may actually hold.
 *
 * Wider than {@link AuthProviderId} because `withIGRPAuth` accepts a
 * fully-constructed provider object, whose `id` ("github", "azure-ad", …) is
 * not in this package's registry. Typing the JWT field as `AuthProviderId` did
 * not make that case go away — it only hid it, which is how every custom-provider
 * session came to be stamped `"none"` and then force-logged-out at its first
 * refresh. `(string & {})` keeps editor autocomplete on the known ids.
 */
export type SessionAuthProviderId = AuthProviderId | (string & {});

type AuthEnvironment = Record<string, string | undefined>;

interface OAuth2Profile extends Record<string, unknown> {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  picture?: string;
}

type AuthProviderDefinition = {
  requiredEnvKeys: readonly string[];
  getDiscoveryUrl: (env: AuthEnvironment) => string;
  createProvider: (env: AuthEnvironment) => OAuthConfig<OAuth2Profile> | null;
};

/**
 * What an ABSENT `AUTH_PROVIDER` resolves to.
 *
 * `none` — i.e. authentication disabled — was the previous default, which meant
 * an app that simply never set the variable ran wide open, and the README
 * documented the opposite ("igrp-auth (default)"). On the root package of the
 * auth chain the safe reading of the docs has to be the actual behaviour, so
 * the default is the real provider: an unconfigured app now fails closed with
 * the `IGRPAuthConfigError` diagnostic page (missing `IGRP_AUTH_*` env vars)
 * rather than silently serving unauthenticated traffic.
 *
 * Disabling auth is still fully supported — it just has to be said out loud,
 * with `AUTH_PROVIDER=none`.
 */
const DEFAULT_AUTH_PROVIDER_ID: AuthProviderId = IGRP_AUTH_PROVIDER_ID;

// `openid` is mandatory for OIDC — always inject it regardless of what IGRP_AUTH_SCOPES contains.
function buildScopeString(raw: string | undefined): string {
  const scopes = new Set(['openid']);
  if (raw?.trim()) {
    for (const s of raw.trim().split(/\s+/)) scopes.add(s);
  }
  return [...scopes].join(' ');
}

function getRequiredEnvValue(env: AuthEnvironment, key: string) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required authentication environment variable: ${key}`);
  }

  return value;
}

/**
 * Subject identifier for a profile, with a loud fallback.
 *
 * Returns `sub` when present. Otherwise falls back to `preferred_username`,
 * then `email`, warning once — those are user-changeable, so an identity keyed
 * on them is not stable across a rename. Returns `''` when nothing usable
 * exists, which NextAuth surfaces as a failed sign-in rather than a session
 * with a silently missing id.
 */
function resolveProfileId(profile: OAuth2Profile): string {
  if (typeof profile.sub === 'string' && profile.sub.length > 0) return profile.sub;

  const fallback =
    (typeof profile.preferred_username === 'string' ? profile.preferred_username : '') ||
    (typeof profile.email === 'string' ? profile.email : '');

  warnOnce('providers.profileMissingSub', () =>
    console.warn(
      '[providers] the IdP profile has no `sub` claim, which OIDC requires. ' +
        (fallback
          ? `Falling back to ${profile.preferred_username ? 'preferred_username' : 'email'} as the user id — ` +
            'this is NOT stable across a username/email change.'
          : 'No usable fallback either; sign-in will fail.'),
    ),
  );

  return fallback;
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const AUTH_PROVIDER_REGISTRY: Record<AuthProviderId, AuthProviderDefinition> = {
  [IGRP_AUTH_PROVIDER_ID]: {
    requiredEnvKeys: ['IGRP_AUTH_CLIENT_ID', 'IGRP_AUTH_CLIENT_SECRET', 'IGRP_AUTH_ISSUER'],
    getDiscoveryUrl: (env) =>
      `${stripTrailingSlash(getRequiredEnvValue(env, 'IGRP_AUTH_ISSUER'))}/.well-known/openid-configuration`,
    createProvider: (env) => ({
      id: IGRP_AUTH_PROVIDER_ID,
      name: 'IGRP Auth',
      type: 'oauth',
      idToken: true,
      // PKCE (RFC 7636, S256) defends the authorization-code exchange against
      // code-interception attacks even when the client_secret is confidential.
      // `nonce` is required to validate the id_token (CWE-294 replay).
      // `state` is kept explicit rather than relying on the v4 default.
      checks: ['pkce', 'state', 'nonce'],
      clientId: getRequiredEnvValue(env, 'IGRP_AUTH_CLIENT_ID'),
      clientSecret: getRequiredEnvValue(env, 'IGRP_AUTH_CLIENT_SECRET'),
      wellKnown: `${stripTrailingSlash(getRequiredEnvValue(env, 'IGRP_AUTH_ISSUER'))}/.well-known/openid-configuration`,
      authorization: {
        params: {
          scope: buildScopeString(env.IGRP_AUTH_SCOPES),
        },
      },
      profile(profile: OAuth2Profile) {
        return {
          // `sub` is mandatory in OIDC and is the only stable identifier here,
          // so it is what NextAuth turns into `token.sub` / `session.user.id`.
          // It was the one field in this mapper with no fallback: an IdP that
          // omits it produced `id: undefined`, which sign-in tolerates and then
          // surfaces much later as a permanently empty `session.user.id`.
          // Degrade to a less-stable identifier rather than none, and say so.
          id: resolveProfileId(profile),
          name: profile.name ?? profile.preferred_username ?? null,
          email: profile.email ?? null,
          image: typeof profile.picture === 'string' ? profile.picture : null,
        };
      },
    }),
  },
  [NONE_PROVIDER_ID]: {
    requiredEnvKeys: [],
    getDiscoveryUrl: () => '',
    createProvider: () => null,
  },
};

/**
 * True for a provider id this package manages end to end: it is in the registry
 * AND is a real IdP (not the `none` bypass). Everything OIDC — discovery,
 * refresh, introspection, revocation, end-session — only applies to these.
 *
 * A custom provider passed straight to `withIGRPAuth` (`provider:
 * GitHubProvider({...})`) is NOT managed: the framework has no issuer, no
 * discovery document and no client credentials for it, so it must leave that
 * provider's tokens alone rather than force a logout it cannot fix.
 */
export function isOidcManagedProviderId(providerId: string | undefined): providerId is 'igrp-auth' {
  return (
    typeof providerId === 'string' &&
    providerId !== NONE_PROVIDER_ID &&
    Object.hasOwn(AUTH_PROVIDER_REGISTRY, providerId)
  );
}

export function getAuthProviderIdFromEnv(
  env: AuthEnvironment,
  fallbackProviderId: AuthProviderId = DEFAULT_AUTH_PROVIDER_ID,
): AuthProviderId {
  const raw = env.AUTH_PROVIDER;

  // ABSENT and PRESENT-BUT-EMPTY are deliberately NOT the same thing.
  //
  // Treating `AUTH_PROVIDER=` as "unset" (a `||` fallback) looks tidy and is
  // wrong here, because the value this variable falls back to decides whether
  // authentication runs at all. With the fallback, an empty assignment resolved
  // to a provider, `isAuthDisabled()` answered true, and a middleware following
  // this package's own documented pattern ("use as the first check") let every
  // request through. A typo must never be able to silently switch auth off — it
  // fails loudly here instead, and `isAuthEnabled` maps that throw to "enabled"
  // so the failure is closed as well as loud.
  if (raw !== undefined && raw.trim() === '') {
    throw new Error(
      'AUTH_PROVIDER is set but empty. Remove the variable to accept the default ' +
        `("${DEFAULT_AUTH_PROVIDER_ID}"), or give it one of: ${Object.keys(AUTH_PROVIDER_REGISTRY).join(', ')}. ` +
        'An empty value is refused rather than defaulted, because defaulting it could disable authentication.',
    );
  }

  const normalizedProviderId = raw?.trim().toLowerCase() ?? fallbackProviderId;
  const providerDefinition = AUTH_PROVIDER_REGISTRY[normalizedProviderId as AuthProviderId];

  if (!providerDefinition) {
    throw new Error(
      `Unsupported AUTH_PROVIDER "${normalizedProviderId}". Expected one of: ${Object.keys(AUTH_PROVIDER_REGISTRY).join(', ')}`,
    );
  }

  return normalizedProviderId as AuthProviderId;
}

export function getAuthProviderDefinition(env: AuthEnvironment, providerId?: AuthProviderId) {
  const resolvedProviderId = providerId ?? getAuthProviderIdFromEnv(env);
  const definition = AUTH_PROVIDER_REGISTRY[resolvedProviderId];

  // An id that is not in the registry — a custom provider's own id arriving via
  // `token.authProviderId` — used to spread `undefined` into a half-built
  // object whose `requiredEnvKeys` was missing, so the next `.filter` threw a
  // bare `TypeError` several frames away from the cause.
  if (!definition) {
    throw new Error(
      `No IGRP auth provider definition for "${resolvedProviderId}". Expected one of: ${Object.keys(
        AUTH_PROVIDER_REGISTRY,
      ).join(
        ', ',
      )}. Custom providers are not managed by this package — guard with isOidcManagedProviderId().`,
    );
  }

  return {
    id: resolvedProviderId,
    ...definition,
  };
}

export function getMissingAuthProviderEnvVars(env: AuthEnvironment, providerId?: AuthProviderId) {
  const definition = getAuthProviderDefinition(env, providerId);

  return definition.requiredEnvKeys.filter((key) => !env[key]?.trim());
}

export function assertAuthProviderEnv(env: AuthEnvironment, providerId?: AuthProviderId) {
  const resolvedProviderId = providerId ?? getAuthProviderIdFromEnv(env);
  const missingEnvVars = getMissingAuthProviderEnvVars(env, resolvedProviderId);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required authentication environment variables for "${resolvedProviderId}": ${missingEnvVars.join(', ')}`,
    );
  }
}

export function createAuthProviderFromEnv(env: AuthEnvironment, providerId?: AuthProviderId) {
  const definition = getAuthProviderDefinition(env, providerId);

  assertAuthProviderEnv(env, definition.id);

  return definition.createProvider(env);
}

export function getAuthProviderDiscoveryUrl(env: AuthEnvironment, providerId?: AuthProviderId) {
  const definition = getAuthProviderDefinition(env, providerId);

  assertAuthProviderEnv(env, definition.id);

  return definition.getDiscoveryUrl(env);
}

export function isAuthEnabled(env: AuthEnvironment): boolean {
  try {
    const providerId = getAuthProviderIdFromEnv(env);
    return providerId !== NONE_PROVIDER_ID;
  } catch {
    return true;
  }
}

export function isAuthDisabled(env: AuthEnvironment): boolean {
  return !isAuthEnabled(env);
}

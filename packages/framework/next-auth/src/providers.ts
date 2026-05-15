import type { OAuthConfig } from 'next-auth/providers/oauth';

export const IGRP_AUTH_PROVIDER_ID = 'igrp-auth' as const;
export const NONE_PROVIDER_ID = 'none' as const;

export const AUTH_PROVIDER_IDS = {
  IGRP_AUTH: IGRP_AUTH_PROVIDER_ID,
  NONE: NONE_PROVIDER_ID,
} as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[keyof typeof AUTH_PROVIDER_IDS];

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

const DEFAULT_AUTH_PROVIDER_ID = NONE_PROVIDER_ID;

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
          id: profile.sub,
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

export function getAuthProviderIdFromEnv(
  env: AuthEnvironment,
  fallbackProviderId: AuthProviderId = DEFAULT_AUTH_PROVIDER_ID,
): AuthProviderId {
  const normalizedProviderId = env.AUTH_PROVIDER?.trim().toLowerCase() ?? fallbackProviderId;
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

  return {
    id: resolvedProviderId,
    ...AUTH_PROVIDER_REGISTRY[resolvedProviderId],
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

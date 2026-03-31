import KeycloakProvider from 'next-auth/providers/keycloak';
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth';

export const KEYCLOAK_PROVIDER_ID = 'keycloak';
export const AUTENTIKA_PROVIDER_ID = 'autentika';

export const AUTH_PROVIDER_IDS = {
  KEYCLOAK: KEYCLOAK_PROVIDER_ID,
  AUTENTIKA: AUTENTIKA_PROVIDER_ID,
} as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[keyof typeof AUTH_PROVIDER_IDS];

type AuthEnvironment = Record<string, string | undefined>;

interface AutentikaProfile extends Record<string, unknown> {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  picture?: string;
}

type AuthProviderDefinition = {
  requiredEnvKeys: readonly string[];
  getDiscoveryUrl: (env: AuthEnvironment) => string;
  createProvider: (env: AuthEnvironment) => OAuthConfig<AutentikaProfile> | ReturnType<typeof KeycloakProvider>;
};

const DEFAULT_AUTH_PROVIDER_ID = KEYCLOAK_PROVIDER_ID;
const DEFAULT_AUTENTIKA_SCOPES = 'openid internal_login';

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

function buildAutentikaDiscoveryUrl(env: AuthEnvironment) {
  const host = stripTrailingSlash(getRequiredEnvValue(env, 'AUTENTIKA_HOST'));
  const tenantName = env.AUTENTIKA_TENANT_NAME;

  return `${host}${tenantName ? `/t/${tenantName}` : ``}/oauth2/token/.well-known/openid-configuration`;
}

function AutentikaProvider(
  options: OAuthUserConfig<AutentikaProfile> & {
    host: string;
    tenantName?: string;
    scopes?: string;
  },
): OAuthConfig<AutentikaProfile> {
  const host = stripTrailingSlash(options.host);
  const tenantName = options.tenantName;
  const scopes = options.scopes?.trim() || DEFAULT_AUTENTIKA_SCOPES;

  return {
    id: AUTENTIKA_PROVIDER_ID,
    name: 'AUTENTIKA',
    type: 'oauth',
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    wellKnown: `${host}${tenantName ? `/t/${tenantName}` : ``}/oauth2/token/.well-known/openid-configuration`,
    authorization: {
      params: {
        scope: scopes,
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name ?? profile.preferred_username ?? null,
        email: profile.email ?? null,
        image: typeof profile.picture === 'string' ? profile.picture : null,
      };
    },
    style: {
      logo: '',
      bg: '',
      text: '',
    },
    options,
  };
}

const AUTH_PROVIDER_REGISTRY: Record<AuthProviderId, AuthProviderDefinition> = {
  [KEYCLOAK_PROVIDER_ID]: {
    requiredEnvKeys: ['KEYCLOAK_CLIENT_ID', 'KEYCLOAK_CLIENT_SECRET', 'KEYCLOAK_ISSUER'],
    getDiscoveryUrl: (env) =>
      `${stripTrailingSlash(getRequiredEnvValue(env, 'KEYCLOAK_ISSUER'))}/.well-known/openid-configuration`,
    createProvider: (env) =>
      KeycloakProvider({
        clientId: getRequiredEnvValue(env, 'KEYCLOAK_CLIENT_ID'),
        clientSecret: getRequiredEnvValue(env, 'KEYCLOAK_CLIENT_SECRET'),
        issuer: stripTrailingSlash(getRequiredEnvValue(env, 'KEYCLOAK_ISSUER')),
      }),
  },
  [AUTENTIKA_PROVIDER_ID]: {
    requiredEnvKeys: [
      'AUTENTIKA_CLIENT_ID',
      'AUTENTIKA_CLIENT_SECRET',
      'AUTENTIKA_HOST'
    ],
    getDiscoveryUrl: buildAutentikaDiscoveryUrl,
    createProvider: (env) =>
      AutentikaProvider({
        clientId: getRequiredEnvValue(env, 'AUTENTIKA_CLIENT_ID'),
        clientSecret: getRequiredEnvValue(env, 'AUTENTIKA_CLIENT_SECRET'),
        host: getRequiredEnvValue(env, 'AUTENTIKA_HOST'),
        tenantName: env.AUTENTIKA_TENANT_NAME,
        scopes: env.AUTENTIKA_SCOPES,
      }),
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

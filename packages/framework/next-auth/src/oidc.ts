import type { JWT } from './jwt';
import type { AuthProviderId } from './providers';
import {
  assertAuthProviderEnv,
  getAuthProviderDiscoveryUrl,
  getAuthProviderIdFromEnv,
} from './providers';

type AuthEnvironment = Record<string, string | undefined>;

type OpenIdConfiguration = {
  token_endpoint: string;
  revocation_endpoint?: string;
};

const openIdConfigurationCache = new Map<string, Promise<OpenIdConfiguration>>();

function getOpenIdConfiguration(discoveryUrl: string) {
  const cachedConfiguration = openIdConfigurationCache.get(discoveryUrl);

  if (cachedConfiguration) {
    return cachedConfiguration;
  }

  const configurationPromise = fetch(discoveryUrl, {
    headers: {
      Accept: 'application/json',
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenID configuration from ${discoveryUrl}`);
    }

    return (await response.json()) as OpenIdConfiguration;
  });

  openIdConfigurationCache.set(discoveryUrl, configurationPromise);

  return configurationPromise;
}

function getProviderIdFromTokenOrEnv(token: JWT, env: AuthEnvironment): AuthProviderId {
  return (token.authProviderId as AuthProviderId | undefined) ?? getAuthProviderIdFromEnv(env);
}

function getClientCredentials(env: AuthEnvironment, providerId: AuthProviderId) {
  const credentialKeys = {
    keycloak: {
      clientIdKey: 'KEYCLOAK_CLIENT_ID',
      clientSecretKey: 'KEYCLOAK_CLIENT_SECRET',
    },
    autentika: {
      clientIdKey: 'AUTENTIKA_CLIENT_ID',
      clientSecretKey: 'AUTENTIKA_CLIENT_SECRET',
    },
  } as const;

  const { clientIdKey, clientSecretKey } = credentialKeys[providerId];

  return {
    clientId: env[clientIdKey]!,
    clientSecret: env[clientSecretKey]!,
  };
}

export async function refreshOidcAccessToken(token: JWT, env: AuthEnvironment) {
  const providerId = getProviderIdFromTokenOrEnv(token, env);

  assertAuthProviderEnv(env, providerId);

  if (!token.refreshToken) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };
  }

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  const { clientId, clientSecret } = getClientCredentials(env, providerId);

  const response = await fetch(openIdConfiguration.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    }),
  });

  if (!response.ok) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };
  }

  const refreshedToken = await response.json();

  return {
    ...token,
    accessToken: refreshedToken.access_token,
    idToken: refreshedToken.id_token ?? token.idToken,
    expiresAt: Math.floor(Date.now() / 1000 + (refreshedToken.expires_in ?? 0)),
    refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    authProviderId: providerId,
    error: undefined,
    forceLogout: false,
  };
}

export async function revokeOidcSession(token: JWT, env: AuthEnvironment) {
  const providerId = getProviderIdFromTokenOrEnv(token, env);

  assertAuthProviderEnv(env, providerId);

  if (!token.refreshToken) {
    return;
  }

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  const revocationEndpoint = openIdConfiguration.revocation_endpoint;

  if (!revocationEndpoint) {
    return;
  }

  const { clientId, clientSecret } = getClientCredentials(env, providerId);

  await fetch(revocationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token: token.refreshToken,
      token_type_hint: 'refresh_token',
    }),
  });
}

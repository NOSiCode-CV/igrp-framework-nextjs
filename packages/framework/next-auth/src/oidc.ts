import type { JWT } from './jwt';
import {
  assertAuthProviderEnv,
  getAuthProviderDiscoveryUrl,
  getAuthProviderIdFromEnv,
  type AuthProviderId,
} from './providers';

type AuthEnvironment = Record<string, string | undefined>;

type OpenIdConfiguration = {
  token_endpoint: string;
  revocation_endpoint?: string;
  end_session_endpoint?: string;
  introspection_endpoint?: string;
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

function getClientCredentials(env: AuthEnvironment) {
  return {
    clientId: env.IGRP_AUTH_CLIENT_ID!,
    clientSecret: env.IGRP_AUTH_CLIENT_SECRET!,
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
  const { clientId, clientSecret } = getClientCredentials(env);

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
    expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000,
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

  const { clientId, clientSecret } = getClientCredentials(env);

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

export async function buildEndSessionUrl(
  token: JWT,
  env: AuthEnvironment,
  postLogoutRedirectUri: string,
): Promise<string | null> {
  const providerId = getProviderIdFromTokenOrEnv(token, env);
  if (providerId === 'none') return null;
  if (!token.idToken) return null;

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  if (!openIdConfiguration.end_session_endpoint) return null;

  const { clientId } = getClientCredentials(env);
  const url = new URL(openIdConfiguration.end_session_endpoint);
  url.searchParams.set('id_token_hint', token.idToken);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  url.searchParams.set('client_id', clientId);

  return url.toString();
}

export async function introspectOidcToken(token: JWT, env: AuthEnvironment): Promise<boolean> {
  if (!token.accessToken) return true;

  const providerId = getProviderIdFromTokenOrEnv(token, env);
  if (providerId === 'none') return true;

  try {
    const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
    const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
    if (!openIdConfiguration.introspection_endpoint) return true;

    const { clientId, clientSecret } = getClientCredentials(env);
    const credentials = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch(openIdConfiguration.introspection_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        token: token.accessToken,
        token_type_hint: 'access_token',
      }),
    });

    if (!response.ok) return true;

    const result = (await response.json()) as { active?: boolean };
    return result.active !== false;
  } catch {
    return true;
  }
}

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

const DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000;

type DiscoveryCacheEntry = { promise: Promise<OpenIdConfiguration>; expiresAt: number };

const openIdConfigurationCache = new Map<string, DiscoveryCacheEntry>();

function getOpenIdConfiguration(discoveryUrl: string) {
  const cached = openIdConfigurationCache.get(discoveryUrl);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = fetch(discoveryUrl, {
    headers: {
      Accept: 'application/json',
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenID configuration from ${discoveryUrl}`);
    }

    return (await response.json()) as OpenIdConfiguration;
  });

  openIdConfigurationCache.set(discoveryUrl, {
    promise,
    expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS,
  });

  // Remove poisoned entry so the next call retries
  promise.catch(() => openIdConfigurationCache.delete(discoveryUrl));

  return promise;
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

// In-flight refresh deduplication. NextAuth invokes the jwt callback once per
// session read; near token expiry, multiple concurrent requests (a server
// component RSC tree + a `useSession` poll + a server action) decode the
// SAME cookie token and each call `refreshOidcAccessToken` with the same
// refresh_token. With refresh-token rotation, the IdP accepts the FIRST call
// and rejects every subsequent one with `invalid_grant` — the last cookie
// write wins, so the user can be logged out even though one refresh
// succeeded. Sharing the in-flight promise collapses N concurrent calls into
// one network round-trip and one cookie write.
//
// In-memory only; multi-instance deployments can still race across pods.
// Single-process dev is fully covered; sticky routing covers most prod.
const inflightRefreshes = new Map<string, Promise<JWT>>();

export async function refreshOidcAccessToken(token: JWT, env: AuthEnvironment): Promise<JWT> {
  if (!token.refreshToken) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };
  }

  const refreshKey = token.refreshToken;
  const existing = inflightRefreshes.get(refreshKey);
  if (existing) return existing;

  const tokenWithRefresh = token as JWT & { refreshToken: string };
  const promise = performRefresh(tokenWithRefresh, env).finally(() => {
    inflightRefreshes.delete(refreshKey);
  });
  inflightRefreshes.set(refreshKey, promise);
  return promise;
}

async function performRefresh(
  token: JWT & { refreshToken: string },
  env: AuthEnvironment,
): Promise<JWT> {
  const providerId = getProviderIdFromTokenOrEnv(token, env);

  assertAuthProviderEnv(env, providerId);

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  const { clientId, clientSecret } = getClientCredentials(env);

  // Include the original auth scopes on refresh so the IdP re-issues an
  // id_token with `sid` matching the *current* servlet session. Spring
  // Authorization Server (and other OIDC v1 servers) gate id_token issuance
  // on `openid` being present in the refresh request — without it, refresh
  // returns access_token + refresh_token only, leaving the original id_token
  // in the JWT pointing at a stale session id. That stale `sid` then causes
  // /connect/logout to no-op: Spring compares `id_token_hint.sid` to the
  // current JSESSIONID's hashed session id, sees mismatch, and redirects
  // without invalidating the session.
  const requestedScopes = (env.IGRP_AUTH_SCOPES ?? 'openid')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!requestedScopes.includes('openid')) requestedScopes.unshift('openid');

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
      scope: requestedScopes.join(' '),
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

  if (!refreshedToken.access_token || typeof refreshedToken.access_token !== 'string') {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      forceLogout: true,
    };
  }

  // Dev-mode: verify the IdP honored the `scope=openid` request and
  // returned a fresh id_token. If `gotFreshIdToken` is false here, OIDC
  // logout will fail silently because our cached id_token's `sid` no longer
  // matches the current servlet session.
  if (env.NODE_ENV !== 'production') {
    const gotFreshIdToken =
      typeof refreshedToken.id_token === 'string' && refreshedToken.id_token.length > 0;
    if (!gotFreshIdToken) {
      console.warn(
        '[oidc.refreshOidcAccessToken] IdP did not return a new id_token on refresh — ' +
          'OIDC end-session may fail because the stored id_token references a stale session id. ' +
          'Check the IdP\'s OIDC refresh-token grant configuration (Spring AS requires the ' +
          'refresh-token grant authentication-converter to include the openid scope).',
      );
    } else {
      console.debug('[oidc.refreshOidcAccessToken] refresh returned a fresh id_token');
    }
  }

  return {
    ...token,
    accessToken: refreshedToken.access_token,
    idToken: refreshedToken.id_token || token.idToken,
    expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000,
    refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    authProviderId: providerId,
    error: undefined,
    forceLogout: false,
  };
}

/**
 * Outcome of {@link revokeOidcSession}. The caller (typically NextAuth
 * `events.signOut`) can log or surface this; callers that need a "fire and
 * forget" call can simply ignore the returned value.
 *
 * Why a tagged result instead of throwing?
 * - Revocation is best-effort and must never block local sign-out.
 * - Callers in the signout path can't reasonably `try`/`catch` and still
 *   know *why* it skipped (no token, no endpoint, network error, 4xx).
 */
export type RevokeOidcSessionResult =
  | { ok: true; status: number }
  | { ok: false; reason: 'no_refresh_token' | 'no_revocation_endpoint' | 'http_error' | 'network_error'; status?: number; body?: string; error?: unknown };

export async function revokeOidcSession(
  token: JWT,
  env: AuthEnvironment,
): Promise<RevokeOidcSessionResult> {
  const providerId = getProviderIdFromTokenOrEnv(token, env);

  assertAuthProviderEnv(env, providerId);

  if (!token.refreshToken) {
    return { ok: false, reason: 'no_refresh_token' };
  }

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  const revocationEndpoint = openIdConfiguration.revocation_endpoint;

  if (!revocationEndpoint) {
    return { ok: false, reason: 'no_revocation_endpoint' };
  }

  const { clientId, clientSecret } = getClientCredentials(env);

  let response: Response;
  try {
    response = await fetch(revocationEndpoint, {
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
  } catch (error) {
    return { ok: false, reason: 'network_error', error };
  }

  if (!response.ok) {
    // Capture body for diagnostics — IdP error messages here are typically small.
    const body = await response.text().catch(() => '');
    return { ok: false, reason: 'http_error', status: response.status, body };
  }

  return { ok: true, status: response.status };
}

export async function buildEndSessionUrl(
  token: JWT,
  env: AuthEnvironment,
  postLogoutRedirectUri: string,
): Promise<string | null> {
  const isDev = env.NODE_ENV !== 'production';

  const providerId = getProviderIdFromTokenOrEnv(token, env);
  if (providerId === 'none') {
    if (isDev) {
      console.warn(
        '[oidc.buildEndSessionUrl] returning null — provider is "none" (AUTH_PROVIDER=none)',
      );
    }
    return null;
  }

  const discoveryUrl = getAuthProviderDiscoveryUrl(env, providerId);
  const openIdConfiguration = await getOpenIdConfiguration(discoveryUrl);
  if (!openIdConfiguration.end_session_endpoint) {
    if (isDev) {
      console.warn(
        `[oidc.buildEndSessionUrl] returning null — discovery doc at ${discoveryUrl} has no end_session_endpoint`,
      );
    }
    return null;
  }

  const { clientId } = getClientCredentials(env);
  const url = new URL(openIdConfiguration.end_session_endpoint);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  const hasIdToken = typeof token.idToken === 'string' && token.idToken.length > 0;
  if (hasIdToken) {
    url.searchParams.set('id_token_hint', token.idToken as string);
  }

  if (isDev) {
    // Spring Authorization Server (and most OIDC IdPs) treat the request
    // very differently depending on which of these three are present.
    // Log the booleans so we can tell from server logs alone whether the
    // request had everything Spring's OidcLogoutEndpointFilter needs.
    console.debug('[oidc.buildEndSessionUrl] built URL', {
      endSessionEndpoint: openIdConfiguration.end_session_endpoint,
      hasClientId: true,
      hasPostLogoutRedirectUri: true,
      postLogoutRedirectUri,
      hasIdTokenHint: hasIdToken,
    });
  }

  return url.toString();
}

export async function introspectOidcToken(token: JWT, env: AuthEnvironment): Promise<boolean> {
  // Introspect the REFRESH token, not the access token. This gate only runs
  // once the access token has expired (or is inside its refresh buffer), at
  // which point an access-token introspection always returns `active: false`
  // per RFC 7662 — so gating on it would block every refresh exactly when one
  // is needed. The refresh token's liveness is what actually determines
  // whether the upcoming `grant_type=refresh_token` call can succeed, and lets
  // us detect a server-side revocation before attempting the grant.
  if (!token.refreshToken) return true;

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
        token: token.refreshToken,
        token_type_hint: 'refresh_token',
      }),
    });

    if (!response.ok) return true;

    const result = (await response.json()) as { active?: boolean };
    return result.active !== false;
  } catch {
    return true;
  }
}

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

// Hard ceiling for IdP round-trips that sit on a user-blocking critical path
// (notably `events.signOut` → discovery + `revokeOidcSession`, which delays the
// /api/auth/signout response — and therefore the session-cookie clear — until
// it resolves). `fetch` has no default timeout, so a slow or unreachable IdP
// would otherwise hang sign-out indefinitely, leaving the user "logged out" in
// the UI but still holding a valid cookie. Time-boxing converts the hang into a
// prompt, recoverable failure: local sign-out still completes and the caller
// falls back to /login.
const IDP_FETCH_TIMEOUT_MS = 4000;

// Bounded retry for the refresh-token grant. The access token has a short TTL
// (~3 min against the IGRP IdP), so refreshes are frequent and a single
// transient blip (network error, timeout, or a 5xx during an IdP deploy)
// should not immediately log the user out. 4xx responses — notably
// `invalid_grant` for a consumed/expired refresh token — are permanent and are
// never retried (replaying a rotated token only earns another rejection).
const REFRESH_MAX_ATTEMPTS = 2;
const REFRESH_RETRY_DELAY_MS = 300;

/**
 * `fetch` with an AbortController-backed timeout. On timeout the returned
 * promise rejects with the AbortError, which existing call sites already treat
 * as a network failure (cache eviction + retry for discovery, `network_error`
 * for revocation).
 */
function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

type DiscoveryCacheEntry = { promise: Promise<OpenIdConfiguration>; expiresAt: number };

const openIdConfigurationCache = new Map<string, DiscoveryCacheEntry>();

function getOpenIdConfiguration(discoveryUrl: string) {
  const cached = openIdConfigurationCache.get(discoveryUrl);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = fetchWithTimeout(
    discoveryUrl,
    {
      headers: {
        Accept: 'application/json',
      },
    },
    IDP_FETCH_TIMEOUT_MS,
  ).then(async (response) => {
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

// Rotation-result recovery cache. NextAuth runs the jwt callback on every
// session read, including RSC renders where `cookies()` is read-only. When the
// IdP ROTATES refresh tokens, a refresh that runs inside an RSC render rotates
// the token but cannot persist it; the next read replays the consumed token and
// the IdP rejects it with `invalid_grant`, logging the user out of a healthy
// session. Keyed by the CONSUMED refresh token, this remembers the rotated
// result for a short window so the next persist-capable read (the client
// session poll or a server action) can recover and persist it.
//
// Where `inflightRefreshes` collapses CONCURRENT refreshes, this bridges
// SEQUENTIAL ones (an RSC render, then a later poll) — the gap the dedup misses.
//
// TTL is coupled to the access-token lifetime / session poll interval: the entry
// must outlive the gap between an RSC rotation and the next persisting poll.
// With a ~180s access token and a 150s poll, 180s comfortably bridges it while
// holding a soon-stale refresh token in memory only briefly.
//
// In-memory only; multi-instance deployments without sticky sessions can still
// race across pods (same limitation as `inflightRefreshes`). The `recoveryStore`
// object is the seam where a shared store (e.g. Redis) could later drop in.
const RECOVERY_TTL_MS = 180_000;
const RECOVERY_MAX_ENTRIES = 5000;

type RecoveryEntry = { result: JWT; expiresAt: number };

const recoveryStore = (() => {
  const entries = new Map<string, RecoveryEntry>();

  function sweepExpired(now: number) {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key);
    }
  }

  return {
    get(refreshToken: string | undefined): JWT | null {
      if (!refreshToken) return null;
      const entry = entries.get(refreshToken);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(refreshToken);
        return null;
      }
      return entry.result;
    },
    set(refreshToken: string, result: JWT) {
      const now = Date.now();
      if (entries.size >= RECOVERY_MAX_ENTRIES) {
        sweepExpired(now);
        if (entries.size >= RECOVERY_MAX_ENTRIES) {
          // Still full after sweeping — drop the oldest insertion (Map preserves order).
          const oldest = entries.keys().next().value;
          if (oldest !== undefined) entries.delete(oldest);
        }
      }
      entries.set(refreshToken, { result, expiresAt: now + RECOVERY_TTL_MS });
    },
  };
})();

/**
 * Returns a rotated token previously cached by {@link refreshOidcAccessToken}
 * for the given (now-consumed) refresh token, or null if absent/expired. Pure
 * peek — no network, no deletion-on-read (both an RSC read and the persisting
 * poll may need the same entry before one persists; it self-evicts by TTL).
 */
export function getRecoveredToken(refreshToken: string | undefined): JWT | null {
  return recoveryStore.get(refreshToken);
}

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

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: token.refreshToken,
    scope: requestedScopes.join(' '),
  });

  // Retry only on TRANSIENT failures (network error/timeout, or 5xx). A 4xx is
  // a permanent decision by the IdP (`invalid_grant`, `invalid_client`, …) and
  // breaks out immediately — retrying it is pointless and, with rotation, the
  // refresh token is already spent.
  let response: Response | undefined;
  for (let attempt = 1; attempt <= REFRESH_MAX_ATTEMPTS; attempt++) {
    try {
      response = await fetchWithTimeout(
        openIdConfiguration.token_endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        },
        IDP_FETCH_TIMEOUT_MS,
      );
    } catch {
      // Network error or timeout (AbortError) — transient.
      response = undefined;
    }

    if (response) {
      if (response.ok) break;
      // 4xx — permanent; do not retry.
      if (response.status < 500) break;
      // 5xx falls through to retry.
    }

    if (attempt < REFRESH_MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
    }
  }

  if (!response || !response.ok) {
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
          "Check the IdP's OIDC refresh-token grant configuration (Spring AS requires the " +
          'refresh-token grant authentication-converter to include the openid scope).',
      );
    }
  }

  const oldRefreshToken = token.refreshToken;
  const newRefreshToken: string = refreshedToken.refresh_token ?? token.refreshToken;
  const refreshed: JWT = {
    ...token,
    accessToken: refreshedToken.access_token,
    idToken: refreshedToken.id_token || token.idToken,
    expiresAt: Date.now() + (refreshedToken.expires_in ?? 3600) * 1000,
    refreshToken: newRefreshToken,
    authProviderId: providerId,
    error: undefined,
    forceLogout: false,
  };

  // The IdP rotated the refresh token. If this refresh ran where the cookie
  // can't be persisted (an RSC render), the rotated token would be lost and the
  // next read would replay the consumed one → invalid_grant → logout. Remember
  // the outcome keyed by the CONSUMED token so the next persist-capable read can
  // recover it. Skip when the token was reused (the cookie's token still works).
  if (newRefreshToken !== oldRefreshToken) {
    recoveryStore.set(oldRefreshToken, refreshed);
  }

  return refreshed;
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
  | {
      ok: false;
      reason: 'no_refresh_token' | 'no_revocation_endpoint' | 'http_error' | 'network_error';
      status?: number;
      body?: string;
      error?: unknown;
    };

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
    // Time-boxed: this runs inside `events.signOut`, which blocks the
    // /api/auth/signout response (and the session-cookie clear) until it
    // settles. A timeout here aborts the wait so local sign-out completes
    // promptly even when the IdP revocation endpoint is unreachable.
    response = await fetchWithTimeout(
      revocationEndpoint,
      {
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
      },
      IDP_FETCH_TIMEOUT_MS,
    );
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

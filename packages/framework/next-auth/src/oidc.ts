import type { JWT } from './jwt';
import {
  assertAuthProviderEnv,
  getAuthProviderDiscoveryUrl,
  getAuthProviderIdFromEnv,
  type AuthProviderId,
} from './providers';
import { createInMemoryTokenRecoveryStore, type IGRPTokenRecoveryStore } from './token-store';
import { sanitizeRedirectUrl, stripAuthApiSuffix } from './sanitize';

export * from './token-store';

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

/**
 * HTTP Basic client authentication per RFC 6749 §2.3.1.
 *
 * Two details a plain `btoa(`${id}:${secret}`)` gets wrong:
 *
 * 1. The spec requires both parts to be form-urlencoded *before* base64. Real
 *    client secrets are usually base64-ish and contain `+` `/` `=`, which a
 *    spec-compliant server (Keycloak, Spring Authorization Server) URL-decodes
 *    on receipt — sending them raw can mismatch.
 * 2. `btoa` is Latin-1 only and THROWS on any non-ASCII character. In
 *    `introspectOidcToken` that throw is swallowed by the outer catch and
 *    turned into a fail-open `true`, silently disabling the revocation gate
 *    for the whole process. Encoding to UTF-8 bytes first removes the throw.
 */
function buildBasicAuthHeader(clientId: string, clientSecret: string): string {
  const encoded = `${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`;
  const bytes = new TextEncoder().encode(encoded);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `Basic ${btoa(binary)}`;
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
const inflightRefreshes = new Map<string, Promise<RefreshOutcome>>();

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
// holding a soon-stale refresh token only briefly.
const RECOVERY_TTL_MS = 180_000;

// Defaults to per-process memory (single instance / sticky routing). Replace
// via configureOidcTokenRecoveryStore with a store backed by shared
// infrastructure for multi-replica deployments without sticky sessions — that
// closes the cross-pod rotation race the in-memory store can't.
//
// The store reference lives on globalThis (keyed by Symbol.for) rather than in
// a module-level variable: tsup inlines this module into each entry chunk
// (dist/config.js, dist/oidc.js, …) and Next.js can instantiate a module once
// per server layer, so a plain `let` would exist as several independent
// copies — configureOidcTokenRecoveryStore would then mutate a copy the jwt
// callback never reads. Symbol.for resolves to the same slot in all copies.
const RECOVERY_STORE_SLOT = Symbol.for('igrp.next-auth.oidc.tokenRecoveryStore');

type RecoveryStoreSlot = { store: IGRPTokenRecoveryStore };

function recoveryStoreSlot(): RecoveryStoreSlot {
  const g = globalThis as { [RECOVERY_STORE_SLOT]?: RecoveryStoreSlot };
  g[RECOVERY_STORE_SLOT] ??= { store: createInMemoryTokenRecoveryStore() };
  return g[RECOVERY_STORE_SLOT];
}

/**
 * Replaces the rotation-recovery store. Call once at startup — `withIGRPAuth`
 * does this automatically when its `tokenRecoveryStore` option is set.
 */
export function configureOidcTokenRecoveryStore(store: IGRPTokenRecoveryStore): void {
  recoveryStoreSlot().store = store;
}

let warnedRecoveryStoreFailure = false;

/**
 * Store failures must never break a session read, but a silent catch hides a
 * store outage behind sporadic forced logouts. Warn once per process so the
 * operator can tell "store down" apart from "IdP rejected the grant" without
 * flooding logs on every session read during an outage.
 */
function warnRecoveryStoreFailure(operation: 'get' | 'set', error: unknown): void {
  if (warnedRecoveryStoreFailure) return;
  warnedRecoveryStoreFailure = true;
  console.warn(
    `[oidc.tokenRecoveryStore] ${operation} failed — recovery degraded to cache miss; ` +
      'rotated-token recovery is disabled until the store recovers:',
    error instanceof Error ? `${error.name}: ${error.message}` : error,
  );
}

/**
 * Returns a rotated token previously cached by {@link refreshOidcAccessToken}
 * for the given (now-consumed) refresh token, or null if absent/expired. Pure
 * peek — no deletion-on-read (both an RSC read and the persisting poll may
 * need the same entry before one persists; it self-evicts by TTL). A store
 * failure degrades to a cache miss: the recovery path must never take a
 * session read down with it.
 */
export async function getRecoveredToken(refreshToken: string | undefined): Promise<JWT | null> {
  if (!refreshToken) return null;
  try {
    return await recoveryStoreSlot().store.get(refreshToken);
  } catch (error) {
    warnRecoveryStoreFailure('get', error);
    return null;
  }
}

/**
 * The auth material a refresh produces. Deliberately NOT a whole JWT: the
 * in-flight dedup below shares one network round-trip between every concurrent
 * caller, and those callers do not necessarily hold the same token — a
 * `callbacks.jwt` extension may have put different custom fields on each. When
 * the shared promise resolved to a fully-merged JWT built from whichever
 * caller happened to arrive first, those fields leaked across sessions. Each
 * caller now applies this delta to its OWN token.
 */
type RefreshDelta = {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
  refreshToken: string;
  authProviderId: AuthProviderId;
};

type RefreshOutcome =
  | { status: 'refreshed'; delta: RefreshDelta }
  | { status: 'recovered'; token: JWT }
  | { status: 'failed' };

/** Auth-material fields, i.e. everything a refresh is allowed to overwrite. */
export function applyRefreshDelta(token: JWT, delta: RefreshDelta): JWT {
  return {
    ...token,
    accessToken: delta.accessToken,
    idToken: delta.idToken || token.idToken,
    expiresAt: delta.expiresAt,
    refreshToken: delta.refreshToken,
    authProviderId: delta.authProviderId,
    error: undefined,
    forceLogout: false,
  };
}

/**
 * Copies only the auth material out of a token recovered from the rotation
 * store onto the caller's current token. The stored token was built by whoever
 * performed the rotation, so adopting it wholesale would import that caller's
 * custom claims — the same cross-contamination {@link RefreshDelta} avoids.
 */
export function applyRecoveredToken(current: JWT, recovered: JWT): JWT {
  return {
    ...current,
    accessToken: recovered.accessToken,
    idToken: recovered.idToken || current.idToken,
    expiresAt: recovered.expiresAt,
    refreshToken: recovered.refreshToken,
    authProviderId: recovered.authProviderId ?? current.authProviderId,
    error: undefined,
    forceLogout: false,
  };
}

function failedRefresh(token: JWT): JWT {
  return { ...token, error: 'RefreshAccessTokenError', forceLogout: true };
}

export async function refreshOidcAccessToken(token: JWT, env: AuthEnvironment): Promise<JWT> {
  if (!token.refreshToken) return failedRefresh(token);

  const refreshKey = token.refreshToken;
  let inflight = inflightRefreshes.get(refreshKey);
  if (!inflight) {
    const tokenWithRefresh = token as JWT & { refreshToken: string };
    inflight = performRefresh(tokenWithRefresh, env).finally(() => {
      inflightRefreshes.delete(refreshKey);
    });
    inflightRefreshes.set(refreshKey, inflight);
  }

  const outcome = await inflight;
  if (outcome.status === 'refreshed') return applyRefreshDelta(token, outcome.delta);
  if (outcome.status === 'recovered') return applyRecoveredToken(token, outcome.token);
  return failedRefresh(token);
}

async function performRefresh(
  token: JWT & { refreshToken: string },
  env: AuthEnvironment,
): Promise<RefreshOutcome> {
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
    // With a SHARED recovery store, a permanent rejection (invalid_grant) or an
    // exhausted retry often means another replica already rotated this refresh
    // token — its result may have landed in the store after our caller's
    // pre-flight recovery check. Peek once more before declaring the session
    // dead. With the default in-memory store this is a cheap no-op re-check.
    const recovered = await getRecoveredToken(token.refreshToken);
    if (recovered && typeof recovered.accessToken === 'string' && !recovered.error) {
      return { status: 'recovered', token: recovered };
    }

    return { status: 'failed' };
  }

  const refreshedToken = await response.json();

  if (!refreshedToken.access_token || typeof refreshedToken.access_token !== 'string') {
    return { status: 'failed' };
  }

  // Verify the IdP honored the `scope=openid` request and returned a fresh
  // id_token. If `gotFreshIdToken` is false here, OIDC logout will fail
  // silently because our cached id_token's `sid` no longer matches the current
  // servlet session. This warns in production too — a misconfigured IdP breaks
  // RP-initiated logout in deployed environments, where operators most need the
  // signal, not just in dev.
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

  const oldRefreshToken = token.refreshToken;
  const newRefreshToken: string = refreshedToken.refresh_token ?? token.refreshToken;
  const expiresInSec = Number(refreshedToken.expires_in);
  const safeExpiresIn = Number.isFinite(expiresInSec) && expiresInSec > 0 ? expiresInSec : 3600;
  const delta: RefreshDelta = {
    accessToken: refreshedToken.access_token,
    idToken: refreshedToken.id_token || token.idToken,
    expiresAt: Date.now() + safeExpiresIn * 1000,
    refreshToken: newRefreshToken,
    authProviderId: providerId,
  };
  const refreshed: JWT = applyRefreshDelta(token, delta);

  // The IdP rotated the refresh token. If this refresh ran where the cookie
  // can't be persisted (an RSC render), the rotated token would be lost and the
  // next read would replay the consumed one → invalid_grant → logout. Remember
  // the outcome keyed by the CONSUMED token so the next persist-capable read —
  // possibly on another replica when the store is shared — can recover it.
  // Skip when the token was reused (the cookie's token still works). Awaited so
  // a shared store is consistent before the rotated cookie is written; a store
  // outage must not fail a successful refresh.
  if (newRefreshToken !== oldRefreshToken) {
    try {
      await recoveryStoreSlot().store.set(oldRefreshToken, refreshed, RECOVERY_TTL_MS);
    } catch (error) {
      // Best-effort: losing the recovery entry re-opens only the RSC race window.
      warnRecoveryStoreFailure('set', error);
    }
  }

  return { status: 'refreshed', delta };
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
      reason:
        | 'no_refresh_token'
        | 'no_revocation_endpoint'
        | 'http_error'
        | 'network_error'
        // Caller-side deadline: revocation did not settle within the
        // budget the sign-out path allows it (see SIGNOUT_REVOCATION_BUDGET_MS).
        | 'timeout';
      status?: number;
      body?: string;
      error?: unknown;
    };

/**
 * Revokes the session at the IdP (RFC 7009).
 *
 * SECURITY ASSUMPTION: only the **refresh** token is submitted. This relies on
 * the IdP treating a refresh-token revocation as revoking the whole grant —
 * which Keycloak and Spring Authorization Server both do. Against an IdP that
 * revokes only the presented token, the already-issued access token stays
 * usable at resource servers until its own `exp` (~3 min for the IGRP IdP)
 * even though the user has signed out locally. If this package ever targets
 * such an IdP, revoke the access token in a second call.
 */
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

/**
 * Origins a post-logout redirect may target, beyond the app's own.
 *
 * `IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS` is a comma-separated allowlist for
 * the deliberate case (logging out to a portal on another host). Empty by
 * default — same-origin only.
 */
function allowedPostLogoutOrigins(env: AuthEnvironment): string[] {
  const appOrigin = (() => {
    try {
      return new URL(stripAuthApiSuffix(env.NEXTAUTH_URL ?? '')).origin;
    } catch {
      return '';
    }
  })();
  const extra = (env.IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return '';
      }
    })
    .filter(Boolean);
  return [appOrigin, ...extra].filter(Boolean);
}

/**
 * Validates the caller's `post_logout_redirect_uri` before it is handed to the
 * IdP. Returns a safe value, or `null` when nothing usable remains.
 *
 * This parameter reaches the framework from application code that typically
 * derives it from `window.location.origin` and passes it through a Server
 * Action — a publicly callable HTTP endpoint, so the value is attacker
 * controlled. Unvalidated, it is an open redirect wearing the IdP's domain,
 * gated only by whether that IdP happens to enforce byte-for-byte
 * registration. Every other redirect surface in this package is guarded; this
 * is the one that actually leaves the origin.
 */
function sanitizePostLogoutRedirectUri(value: string, env: AuthEnvironment): string | null {
  const allowed = allowedPostLogoutOrigins(env);
  const fallback = allowed[0] ?? null;

  if (typeof value !== 'string' || value.trim().length === 0) return fallback;
  const trimmed = value.trim();

  // Relative path — resolve against the app origin through the shared sanitizer.
  if (trimmed.startsWith('/')) {
    if (!fallback) return null;
    const safePath = sanitizeRedirectUrl(trimmed, fallback, '');
    return safePath ? `${fallback}${safePath}` : fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fallback;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return fallback;

  // No allowlist could be derived (NEXTAUTH_URL unset or malformed, no explicit
  // origins). We have no basis to judge the value, and dropping it would break
  // the redirect back from the IdP for an app that is merely under-configured —
  // so accept it and say so. The IdP's own registration check remains the
  // control in that case.
  if (allowed.length === 0) {
    console.warn(
      '[oidc.buildEndSessionUrl] cannot validate post_logout_redirect_uri — NEXTAUTH_URL is ' +
        'unset or malformed, so the app origin is unknown. Set NEXTAUTH_URL (or ' +
        'IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS) to enable the origin check.',
    );
    return parsed.toString();
  }

  if (!allowed.includes(parsed.origin)) {
    console.warn(
      `[oidc.buildEndSessionUrl] post_logout_redirect_uri origin ${parsed.origin} is not allowed — ` +
        'falling back to the app origin. Add it to IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS if this is intentional.',
    );
    return fallback;
  }
  return parsed.toString();
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

  const safeRedirectUri = sanitizePostLogoutRedirectUri(postLogoutRedirectUri, env);
  if (safeRedirectUri) {
    url.searchParams.set('post_logout_redirect_uri', safeRedirectUri);
  } else if (isDev) {
    console.warn(
      '[oidc.buildEndSessionUrl] no usable post_logout_redirect_uri (none supplied and NEXTAUTH_URL ' +
        'is unset/malformed) — the IdP will apply its own default after logout.',
    );
  }
  const hasIdToken = typeof token.idToken === 'string' && token.idToken.length > 0;
  if (hasIdToken) {
    url.searchParams.set('id_token_hint', token.idToken as string);
  }

  return url.toString();
}

const warnedIntrospection = new Set<string>();

/**
 * Introspection deliberately fails OPEN — a flaky or misconfigured
 * introspection endpoint must never block a refresh. But failing open in
 * silence means an operator cannot tell "the IdP says this token is live" from
 * "introspection has been returning 401 for a month", and the gate that is
 * supposed to catch server-side revocation is simply gone. Warn once per
 * reason, per process.
 */
function warnIntrospectionDisabled(reason: string, detail?: unknown): void {
  if (warnedIntrospection.has(reason)) return;
  warnedIntrospection.add(reason);
  console.warn(
    `[oidc.introspectOidcToken] failing open (${reason}) — server-side revocation is NOT being ` +
      'detected until this is resolved; refresh will proceed regardless.',
    detail instanceof Error ? `${detail.name}: ${detail.message}` : (detail ?? ''),
  );
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
    if (!openIdConfiguration.introspection_endpoint) {
      warnIntrospectionDisabled('no introspection_endpoint in the IdP discovery document');
      return true;
    }

    const { clientId, clientSecret } = getClientCredentials(env);

    const response = await fetchWithTimeout(
      openIdConfiguration.introspection_endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: buildBasicAuthHeader(clientId, clientSecret),
        },
        body: new URLSearchParams({
          token: token.refreshToken,
          token_type_hint: 'refresh_token',
        }),
      },
      IDP_FETCH_TIMEOUT_MS,
    );

    if (!response.ok) {
      warnIntrospectionDisabled(
        `introspection endpoint returned HTTP ${response.status}`,
        response.status === 401 || response.status === 403
          ? 'check IGRP_AUTH_CLIENT_ID / IGRP_AUTH_CLIENT_SECRET'
          : undefined,
      );
      return true;
    }

    const result = (await response.json()) as { active?: boolean };
    return result.active !== false;
  } catch (error) {
    warnIntrospectionDisabled('introspection request threw', error);
    return true;
  }
}

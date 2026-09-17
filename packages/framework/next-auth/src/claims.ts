/**
 * Pure, runtime-agnostic decoding + matching for IGRP access-token claims.
 * No `Buffer` (Edge has none); uses `atob` + `TextDecoder`, available in
 * Node 18+, Edge, and browsers.
 *
 * No SIGNATURE verification: server-side the token is sealed in the NextAuth
 * cookie, and client-side gating is cosmetic. That covers authenticity but says
 * nothing about FRESHNESS, so `exp` is decoded too — a caller making a real
 * authorization decision must reject stale claims with `claimsExpired()`.
 */

export interface IGRPAccessClaims {
  /** Fully-qualified `${dept}.${suffix}`, all departments. Suffix is arbitrary. */
  permissions: string[];
  /** `resource_access[aud].roles`. */
  roles: string[];
  selectedRole?: string;
  /** Active department. */
  org?: string;
  isSuperAdmin: boolean;
  sub?: string;
  email?: string;
  /**
   * `exp` in MILLISECONDS (the raw claim is seconds), or `undefined` when the
   * token carries no `exp`. Exposed so authorization callers can refuse claims
   * from a dead token — see {@link claimsExpired}.
   */
  expiresAt?: number;
}

/**
 * Clock-skew allowance when judging `expiresAt`. The IdP and the app server
 * are different machines; a token is not treated as dead until it is past
 * `exp` by more than this.
 */
export const CLAIMS_CLOCK_SKEW_MS = 30_000;

/**
 * True when the token these claims came from is past its `exp` (plus skew).
 *
 * Claims with no `exp` are NOT treated as expired — some deployments issue
 * tokens without one, and inventing an expiry would deny them permanently.
 *
 * Why this matters: `decodeIgrpClaims` deliberately performs no signature
 * verification, on the grounds that server-side the token arrives sealed
 * inside the NextAuth cookie. That argument covers authenticity, not
 * freshness. A caller that reads the access token straight from the cookie —
 * `getToken` decrypts only, it does not run the `jwt` callback, so no refresh
 * and no expiry gate runs — otherwise honours permissions from a token that
 * expired minutes ago. Revocation then takes effect when the COOKIE dies
 * rather than when the token does.
 */
export function claimsExpired(
  claims: IGRPAccessClaims,
  now: number = Date.now(),
  skewMs: number = CLAIMS_CLOCK_SKEW_MS,
): boolean {
  if (typeof claims.expiresAt !== 'number') return false;
  return claims.expiresAt + skewMs <= now;
}

export type IGRPClaimsState =
  { status: 'ok'; claims: IGRPAccessClaims } | { status: 'error'; error: string };

function base64UrlDecode(input: string): string {
  const padLen = input.length % 4;
  const padded = padLen === 0 ? input : input + '='.repeat(4 - padLen);
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function rolesAt(
  resourceAccess: Record<string, { roles?: string[] }>,
  key: string | undefined,
): string[] | undefined {
  if (!key) return undefined;
  const roles = resourceAccess[key]?.roles;
  return Array.isArray(roles) ? roles : undefined;
}

/**
 * Built-in IdP clients that appear in `aud` / `resource_access` on nearly every
 * Keycloak token but never carry application roles. They are considered only
 * as a last resort, so they can't shadow the real client.
 */
const INTERNAL_IDP_CLIENTS = new Set(['account', 'account-console', 'broker', 'realm-management']);

/**
 * Picks the `resource_access` entry that belongs to *this* client.
 *
 * Taking `aud[0]` is wrong for a multi-audience token: Keycloak routinely
 * issues `aud: ["account", "<client-id>"]`, so the first element resolves to
 * `resource_access.account` and the app's own roles silently disappear —
 * indistinguishable from "user has no roles", because the fallback is `[]`.
 *
 * Resolution order, most to least specific:
 *   1. `azp` (authorized party) — the client the token was actually issued to.
 *   2. The first audience carrying roles that is not a built-in IdP client.
 *   3. The sole application entry in `resource_access`, when there is one.
 *   4. The first audience carrying roles at all (built-ins included), so a
 *      deployment that really does gate on them still works.
 *
 * Deliberately never unions across clients: these roles feed UI gating, and
 * over-granting is the worse failure.
 */
function resolveClientRoles(
  payload: Record<string, unknown>,
  resourceAccess: Record<string, { roles?: string[] }>,
): string[] {
  const byAzp = rolesAt(resourceAccess, typeof payload.azp === 'string' ? payload.azp : undefined);
  if (byAzp) return byAzp;

  const aud = payload.aud;
  const audiences = (Array.isArray(aud) ? aud : typeof aud === 'string' ? [aud] : []).filter(
    (value): value is string => typeof value === 'string',
  );

  for (const audience of audiences) {
    if (INTERNAL_IDP_CLIENTS.has(audience)) continue;
    const roles = rolesAt(resourceAccess, audience);
    if (roles) return roles;
  }

  const appKeys = Object.keys(resourceAccess).filter((key) => !INTERNAL_IDP_CLIENTS.has(key));
  if (appKeys.length === 1) return rolesAt(resourceAccess, appKeys[0]) ?? [];

  for (const audience of audiences) {
    const roles = rolesAt(resourceAccess, audience);
    if (roles) return roles;
  }

  return [];
}

/**
 * Decode the JWT payload of an IGRP access token into claims.
 * THROWS on a missing or malformed token — callers map the throw to an
 * error state so a decode failure is never confused with "no permissions".
 */
export function decodeIgrpClaims(accessToken: string): IGRPAccessClaims {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('decodeIgrpClaims: missing access token');
  }
  const parts = accessToken.split('.');
  if (parts.length !== 3) {
    throw new Error('decodeIgrpClaims: not a JWT');
  }
  const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;

  const resourceAccess = (payload.resource_access ?? {}) as Record<string, { roles?: string[] }>;
  const roles = resolveClientRoles(payload, resourceAccess);

  return {
    permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
    roles,
    selectedRole: typeof payload.selectedRole === 'string' ? payload.selectedRole : undefined,
    org: typeof payload.org === 'string' ? payload.org : undefined,
    isSuperAdmin: payload.is_super_admin === true,
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    // `exp` is seconds since the epoch per RFC 7519; normalise to ms so it is
    // directly comparable with Date.now() and with the JWT's own `expiresAt`.
    expiresAt:
      typeof payload.exp === 'number' && Number.isFinite(payload.exp)
        ? payload.exp * 1000
        : undefined,
  };
}

/**
 * True when the claims grant `name`. Super admin bypasses; a dotted `name`
 * is matched verbatim; a bare `name` is qualified with the active `org`.
 */
export function claimsAllow(claims: IGRPAccessClaims, name: string): boolean {
  if (claims.isSuperAdmin) return true;
  if (!name.includes('.') && !claims.org) return false;
  const qualified = name.includes('.') ? name : `${claims.org}.${name}`;
  return claims.permissions.includes(qualified);
}

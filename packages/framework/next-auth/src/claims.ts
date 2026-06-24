/**
 * Pure, runtime-agnostic decoding + matching for IGRP access-token claims.
 * No `Buffer` (Edge has none); uses `atob` + `TextDecoder`, available in
 * Node 18+, Edge, and browsers. No signature verification — server-side the
 * token is sealed in the NextAuth cookie; client-side gating is cosmetic.
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
}

export type IGRPClaimsState =
  | { status: 'ok'; claims: IGRPAccessClaims }
  | { status: 'error'; error: string };

function base64UrlDecode(input: string): string {
  const padLen = input.length % 4;
  const padded = padLen === 0 ? input : input + '='.repeat(4 - padLen);
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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
  if (parts.length < 2) {
    throw new Error('decodeIgrpClaims: not a JWT');
  }
  const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;

  const aud = payload.aud;
  const audKey = Array.isArray(aud) ? aud[0] : aud;
  const resourceAccess = (payload.resource_access ?? {}) as Record<string, { roles?: string[] }>;
  const roles =
    typeof audKey === 'string' && Array.isArray(resourceAccess[audKey]?.roles)
      ? (resourceAccess[audKey]!.roles as string[])
      : [];

  return {
    permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
    roles,
    selectedRole: typeof payload.selectedRole === 'string' ? payload.selectedRole : undefined,
    org: typeof payload.org === 'string' ? payload.org : undefined,
    isSuperAdmin: payload.is_super_admin === true,
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

/**
 * True when the claims grant `name`. Super admin bypasses; a dotted `name`
 * is matched verbatim; a bare `name` is qualified with the active `org`.
 */
export function claimsAllow(claims: IGRPAccessClaims, name: string): boolean {
  if (claims.isSuperAdmin) return true;
  const qualified = name.includes('.') ? name : claims.org ? `${claims.org}.${name}` : name;
  return claims.permissions.includes(qualified);
}

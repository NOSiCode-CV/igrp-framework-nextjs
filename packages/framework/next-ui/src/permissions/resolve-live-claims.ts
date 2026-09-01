import { decodeIgrpClaims, type IGRPClaimsState } from '@igrp/framework-next-auth/claims';

/**
 * The three session states this resolver cares about, narrowed from next-auth's
 * context value. `null` means **no SessionProvider is mounted** — not "no
 * session".
 */
export interface LiveClaimsSession {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  accessToken?: string;
}

export interface ResolveLiveClaimsArgs {
  /** Server-seeded claims from `igrpGetClaims()` — the SSR / initial value. */
  seeded: IGRPClaimsState;
  /** next-auth session context, or `null` when no provider is mounted. */
  session: LiveClaimsSession | null;
}

/** A JWT has exactly three dot-separated, non-empty parts. */
function isJwtShaped(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/**
 * Decide which claims the client should gate on, given the server-seeded state
 * and the live session.
 *
 * Why this exists: the server-seeded `claims` prop is passed exactly **once per
 * full page load**. Token rotation goes through `getSession()` with no
 * `router.refresh()`, and a shared layout does not re-render on client
 * navigation — so nothing ever hands the provider a fresh prop. Without a live
 * re-decode, client gating answers from login-time claims until a reload.
 *
 * Three guards, each for a specific failure mode:
 *
 * - **G1 — no provider.** `session: null` → keep the seeded state. The caller
 *   must read `SessionContext` directly rather than call `useSession()`, which
 *   *throws* without a provider; `IGRPSectionPermissions` works standalone
 *   today and must keep working.
 * - **G2 — loading.** Mirroring the server exactly would blank every gated
 *   control for a frame on each page load. An error state is entered only when
 *   a token is genuinely present and fails to decode.
 * - **G3 — non-JWT token.** In auth-bypass/preview mode the "token" is the
 *   literal string `preview-token`. Decoding it would fail, G2 would classify
 *   that as a real failure, and **every gate in preview mode would flip to
 *   denied**. Shape-checking also avoids sniffing the super-admin mock's
 *   `{ isSuperAdmin: true, permissions: [] }` shape, which a real super admin
 *   holding no direct permissions would trip.
 */
export function resolveLiveClaims({ seeded, session }: ResolveLiveClaimsArgs): IGRPClaimsState {
  // G1
  if (!session) return seeded;
  // G2
  if (session.status === 'loading') return seeded;
  // G3
  const token = session.accessToken;
  if (!token || !isJwtShaped(token)) return seeded;

  try {
    return { status: 'ok', claims: decodeIgrpClaims(token) };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'claims decode failed',
    };
  }
}

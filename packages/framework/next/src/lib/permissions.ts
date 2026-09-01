import { cache } from 'react';
import { forbidden } from 'next/navigation';
import {
  decodeIgrpClaims,
  claimsAllow,
  type IGRPAccessClaims,
  type IGRPClaimsState,
} from '@igrp/framework-next-auth/claims';

import { igrpGetAccessClientConfig, igrpSetAccessClientConfig } from './api-config';

const SUPER_ADMIN_MOCK: IGRPAccessClaims = { permissions: [], roles: [], isSuperAdmin: true };

const SESSION_COOKIE_BASENAME = 'next-auth.session-token';
const SECURE_SESSION_COOKIE_BASENAME = `__Secure-${SESSION_COOKIE_BASENAME}`;

/**
 * Resolve `getToken`'s `secureCookie` flag from the cookie names actually
 * present, instead of letting it infer the flag from `NEXTAUTH_URL`.
 *
 * Mirrors the identical helper inside `@igrp/framework-next-auth`'s config
 * factory (see its `resolveSecureCookie` / `getAccessToken`). Duplicated rather
 * than shared because exporting it would mean changing `framework-next-auth`,
 * the root of the build chain, dragging a full
 * `auth → types → ds → next-ui → next` rebuild for ten lines.
 *
 * Returns `undefined` when no session cookie is present, so `getToken` keeps
 * its own default.
 */
function resolveSecureCookie(cookieNames: Iterable<string>): boolean | undefined {
  let hasPlain = false;
  for (const name of cookieNames) {
    if (name.startsWith(SECURE_SESSION_COOKIE_BASENAME)) return true;
    if (name.startsWith(SESSION_COOKIE_BASENAME)) hasPlain = true;
  }
  return hasPlain ? false : undefined;
}

/**
 * True for Next.js **control-flow** signals, which are thrown rather than
 * returned: the static-render bailout (`cookies()`/`headers()` read during
 * prerender, digest `DYNAMIC_SERVER_USAGE`), `redirect()`, `notFound()`,
 * `forbidden()`, and the client-side-rendering bailout.
 *
 * These must never be swallowed. Catching the prerender bailout would mask it
 * as "no session", so Next would not mark the route dynamic and the build
 * would fail with a confusing 5xx instead of bailing out cleanly — the exact
 * hazard the template's own `serverSession()` documents and re-throws for.
 *
 * Next tags every one of these with a string `digest`; a genuine failure from
 * `getToken`/cookie decode does not have one.
 */
function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if (typeof (error as { digest?: unknown }).digest === 'string') return true;
  const name = (error as { name?: unknown }).name;
  return name === 'DynamicServerError' || name === 'StaticGenBailoutError';
}

/**
 * Recover the access token straight from the session cookie.
 *
 * Needed because the per-request token lives in an `AsyncLocalStorage` store
 * that only the layout/DAL path establishes. A Server Action or Route Handler
 * is a *fresh* async context: the store is empty, so without this the token is
 * unreachable and every permission check denies — super admins included.
 *
 * Deliberately NOT `getServerSession()`: that needs the app's `NextAuthOptions`
 * (unavailable here), and the `accessToken` is only copied onto the session by
 * the app's own `callbacks.session` — so it would return a session with no
 * token and "fix" nothing. `getToken` needs only the cookies and
 * `NEXTAUTH_SECRET`.
 *
 * `next/headers` and `/jwt` are dynamically imported to keep this module's
 * static graph unchanged for every existing importer of the package root.
 * Returns '' on a genuine failure — the caller maps that to the error state —
 * but re-throws Next's control-flow signals (see `isNextControlFlowError`).
 */
async function recoverAccessTokenFromCookies(): Promise<string> {
  try {
    const [{ cookies }, { getToken }] = await Promise.all([
      import('next/headers'),
      import('@igrp/framework-next-auth/jwt'),
    ]);
    const all = (await cookies()).getAll();
    const secureCookie = resolveSecureCookie(all.map((c) => c.name));
    const token = await getToken({
      req: {
        cookies: Object.fromEntries(all.map((c) => [c.name, c.value])),
      } as Parameters<typeof getToken>[0]['req'],
      secret: process.env.NEXTAUTH_SECRET,
      ...(secureCookie !== undefined ? { secureCookie } : {}),
    });
    return (token as { accessToken?: string } | null)?.accessToken ?? '';
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return '';
  }
}

/**
 * Dev-only diagnostic: a token with no active department (`org`) denies every
 * *bare* permission name (`claimsAllow` qualifies bare names with `org` and
 * fail-closes without it), which is indistinguishable from a genuine denial.
 * Warns once per request — this is a property of the claims, not of one check,
 * which is why it lives here and not in the (deliberately pure) `claimsAllow`.
 */
function warnOnMissingOrg(claims: IGRPAccessClaims): void {
  if (process.env.NODE_ENV === 'production') return;
  if (claims.isSuperAdmin || claims.org) return;
  console.warn(
    '[igrpGetClaims] access token carries no `org` (active department) claim — ' +
      'every bare-name permission check will DENY (fail-closed). Pass a ' +
      'fully-qualified "DEPT.permission" name, or check why the token lacks `org`.',
  );
}

/** True when auth is bypassed (preview mode or AUTH_PROVIDER=none). */
export function isIgrpAuthBypass(env: Record<string, string | undefined> = process.env): boolean {
  const preview =
    String(env.IGRP_PREVIEW_MODE ?? '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .toLowerCase() === 'true';
  const noneProvider =
    String(env.AUTH_PROVIDER ?? '')
      .trim()
      .toLowerCase() === 'none';
  return preview || noneProvider;
}

/**
 * Resolve the current request's permission claims. Bypass → super-admin mock
 * (does NOT attempt to decode the non-JWT preview token). Otherwise decode the
 * per-request access token; a decode failure becomes a distinguishable error
 * state (never silently "no permissions"). Deduped per render via React.cache.
 *
 * Works in Server Actions and Route Handlers as well as renders: when no
 * `AsyncLocalStorage` store was established, the token is recovered from the
 * session cookie and the store is seeded — see
 * `recoverAccessTokenFromCookies`.
 */
// Deduped per request — Next.js resets React's cache() boundary each request,
// so reading process.env (via isIgrpAuthBypass) inside is per-request, not stale.
export const igrpGetClaims = cache(async function igrpGetClaims(): Promise<IGRPClaimsState> {
  if (isIgrpAuthBypass()) {
    return { status: 'ok', claims: { ...SUPER_ADMIN_MOCK } };
  }
  try {
    const current = igrpGetAccessClientConfig();
    let token = current.token;
    if (!token) {
      // No ALS store established (Server Action / Route Handler), or a store
      // seeded with an empty token. Either way the current code path is
      // guaranteed to fail, so recovering here cannot regress a working caller.
      //
      // Establish the store SYNCHRONOUSLY, before the first await, so the
      // object lives in the caller's async context; the write after the await
      // then mutates that same object in place. Seeding only after the await
      // relies on `enterWith` propagating out of a nested async frame, which
      // did not hold in practice (see the T3 case in
      // __tests__/permissions-action-context.test.ts).
      const baseUrl = current.baseUrl || process.env.IGRP_ACCESS_MANAGEMENT_API || '';
      igrpSetAccessClientConfig({ token: '', baseUrl });

      token = await recoverAccessTokenFromCookies();
      if (token) {
        // Seed the token too: a caller that needs claims almost always needs
        // the Access Management client next, and that fails in exactly the
        // same contexts for the same reason.
        igrpSetAccessClientConfig({ token, baseUrl });
      }
    }
    const claims = decodeIgrpClaims(token);
    warnOnMissingOrg(claims);
    return { status: 'ok', claims };
  } catch (error) {
    // Control flow, not a failure: re-throw so Next can mark the route dynamic
    // (or perform the redirect). Before the cookie-recovery path existed,
    // nothing inside this try could raise one of these — `decodeIgrpClaims` is
    // pure and reading the ALS config is synchronous — so this guard arrived
    // with that path.
    if (isNextControlFlowError(error)) throw error;
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'claims decode failed',
    };
  }
});

/**
 * Boolean permission check (token claims). Fail-closed on error.
 * This is the check to use in **Server Actions** — see `igrpAssertAuthorize`
 * for why the asserting variant is page-only.
 */
export async function igrpAuthorize(name: string): Promise<boolean> {
  const state = await igrpGetClaims();
  return state.status === 'ok' && claimsAllow(state.claims, name);
}

/**
 * Page/render guard — **pages only, not Server Actions.**
 *
 * Missing permission → forbidden() (403 → forbidden.tsx). A claims decode
 * error is NOT "forbidden" — it throws so the nearest error.tsx renders a 5xx
 * instead of mislabeling an outage as 403.
 *
 * In a Server Action there is no `forbidden.tsx` boundary, so both the deny and
 * the error path surface as an unhandled action error. Use `igrpAuthorize` and
 * return a typed result (e.g. `{ ok: false, code: 'forbidden' }`) instead.
 */
export async function igrpAssertAuthorize(name: string): Promise<void> {
  const state = await igrpGetClaims();
  if (state.status === 'error') {
    throw new Error(`igrpAssertAuthorize: cannot determine permissions: ${state.error}`);
  }
  if (!claimsAllow(state.claims, name)) {
    forbidden();
  }
}

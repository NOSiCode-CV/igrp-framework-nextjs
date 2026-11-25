import 'server-only';

import { cache } from 'react';
import { forbidden } from 'next/navigation';
import {
  decodeIgrpClaims,
  claimsAllow,
  claimsExpired,
  type IGRPAccessClaims,
  type IGRPClaimsState,
} from '@igrp/framework-next-auth/claims';
import { isIgrpAuthBypass as isIgrpAuthBypassFromAuth } from '@igrp/framework-next-auth/providers';
import { isNextControlFlowError } from '@igrp/framework-next-auth/runtime';

import {
  IGRP_LOCALE_COOKIE,
  igrpNormalizeLocale,
  igrpParseAcceptLanguage,
  type IGRPLocale,
} from '../i18n/config.js';
import {
  igrpGetAccessClientConfig,
  igrpSetAccessClientConfig,
  type IGRPClientRuntimeConfig,
} from './api-config.js';
import { IgrpConfigError } from '../errors.js';

const SUPER_ADMIN_MOCK: IGRPAccessClaims = { permissions: [], roles: [], isSuperAdmin: true };

/**
 * Recover the access token when the per-request store holds none.
 *
 * Needed because the per-request token lives in an `AsyncLocalStorage` store
 * that only the layout/DAL path establishes, and a seed written after an
 * `await` does not reach the caller. A Server Action or Route Handler is a
 * *fresh* async context, and Next renders a page in parallel with its layout:
 * without this the token is unreachable and every permission check denies.
 *
 * First choice is the app's own session read, which `withIGRPAuth` registers
 * (`readIGRPServerSessionAccessToken`): it runs the `jwt` callback, so an
 * expired access token is refreshed, and in a render it shares one cached read
 * (and one refresh) with the layout's `getSession()`. Only when no instance is
 * registered, or the read fails, does it decode the cookie, which does not
 * refresh: after expiry that token is stale and claims fail closed.
 *
 * `next/headers` and `/session-store` are dynamically imported to keep this
 * module's static graph unchanged for every existing importer of the package
 * root. Which cookie is this app's is next-auth's call (`readIGRPSessionToken`).
 * Returns '' on a genuine failure — the caller maps that to the error state —
 * but re-throws Next's control-flow signals (see `isNextControlFlowError`).
 */
async function recoverAccessToken(): Promise<string> {
  try {
    const [{ cookies }, { readIGRPSessionToken, readIGRPServerSessionAccessToken }] =
      await Promise.all([
        import('next/headers'),
        import('@igrp/framework-next-auth/session-store'),
      ]);
    let fromSession: string | undefined;
    try {
      fromSession = await readIGRPServerSessionAccessToken();
    } catch (error) {
      if (isNextControlFlowError(error)) throw error;
      // A failed session read (config error, undecodable cookie) falls back to the cookie.
    }
    if (fromSession !== undefined) return fromSession;
    const token = await readIGRPSessionToken((await cookies()).getAll());
    return token?.accessToken ?? '';
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return '';
  }
}

/**
 * Locale for `Accept-Language` in a Server Action / Route Handler, where the
 * layout that seeds `config.locale` never ran: the locale cookie first, then the
 * request's `Accept-Language`. Any platform locale is accepted (no i18n config
 * here). `undefined` on any failure — a missing locale is never worth failing for.
 */
async function recoverLocaleFromRequest(): Promise<IGRPLocale | undefined> {
  try {
    const { cookies, headers } = await import('next/headers');
    return (
      igrpNormalizeLocale((await cookies()).get(IGRP_LOCALE_COOKIE)?.value) ??
      igrpParseAcceptLanguage((await headers()).get('accept-language'))
    );
  } catch {
    return undefined;
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

/** Parses an env flag the way `.env` loaders leave it: trimmed, unquoted, case-insensitive. */
function envFlag(value: string | undefined, expected: string): boolean {
  return (
    String(value ?? '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim()
      .toLowerCase() === expected
  );
}

/** True when auth is bypassed (preview mode or AUTH_PROVIDER=none). Defined once, in next-auth. */
export function isIgrpAuthBypass(env: Record<string, string | undefined> = process.env): boolean {
  return isIgrpAuthBypassFromAuth(env);
}

/**
 * Throws an `IgrpConfigError` while auth is bypassed, unless
 * `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true`. Skipped only when `NODE_ENV` is
 * `development` or `test`; any other value, unset included, counts as production.
 * Call it from `register()` in the template's `instrumentation.ts`: the throw
 * makes Next log the error and answer every request with 500. The framework's
 * own bypass branches (`igrpGetClaims`, the Server Action session gate) call it
 * too, so a production build fails closed without that wiring.
 */
export function igrpAssertAuthBypassAllowed(
  env: Record<string, string | undefined> = process.env,
): void {
  if (!isIgrpAuthBypass(env)) return;
  if (envFlag(env.NODE_ENV, 'development') || envFlag(env.NODE_ENV, 'test')) return;
  if (envFlag(env.IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION, 'true')) return;
  const variable = [
    envFlag(env.IGRP_PREVIEW_MODE, 'true') && 'IGRP_PREVIEW_MODE',
    envFlag(env.AUTH_PROVIDER, 'none') && 'AUTH_PROVIDER',
  ]
    .filter(Boolean)
    .join(', ');
  throw new IgrpConfigError(
    'IGRP_CONFIG_INVALID',
    `[igrp-auth-bypass]: ${variable} desliga a autenticação num build de produção. ` +
      'Remova a variável deste deploy, ou defina IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true ' +
      'se este ambiente é intencionalmente uma demo sem login.',
    { variable },
  );
}

/**
 * The one way to put Access Management credentials into the per-request store.
 *
 * **With a `seed`** (a session the caller already holds: the layout, the data
 * providers, the app's own `getSession`): applies it and returns. The seed wins
 * over whatever the store held, because it came through the `jwt` callback and
 * may be a refreshed token; a cookie-recovered one never is. `baseUrl` defaults
 * to `IGRP_ACCESS_MANAGEMENT_API`; `undefined` fields are left alone.
 *
 * **Without one**: guarantees the store holds a token, recovering it from the
 * session cookie when nothing seeded it — a Server Action or Route Handler,
 * where the layout/DAL path never ran. Cheap once seeded.
 *
 * Rules that make the store reach the code that reads it, kept here only:
 *  - The store is written synchronously, before this function's first
 *    `await`, so it lands in the CALLER's async context (an async function body
 *    runs in its caller's context up to its first await).
 *  - A component that renders inside `<Suspense>` must call this itself: the
 *    resumed render does not reliably inherit a store seeded by its parent.
 *  - The app's `getSession` must seed before `igrpGetClaims` runs, or claims
 *    fall back to the (unrefreshed) cookie token.
 *  - For a credential meant for ONE call, use `igrpWithAccessClientConfig`:
 *    this writes the request's store in place.
 *
 * Returns the resulting config; `token === ''` means no session could be
 * recovered and every downstream Access Management call will fail. Callers
 * should treat that as unauthenticated and stop, rather than issuing a request
 * with an empty bearer token against an empty base URL.
 */
export async function igrpEnsureAccessClientConfig(
  seed?: Pick<IGRPClientRuntimeConfig, 'token'> & Partial<IGRPClientRuntimeConfig>,
): Promise<IGRPClientRuntimeConfig> {
  const current = igrpGetAccessClientConfig();
  if (seed) {
    const defined = Object.fromEntries(
      Object.entries(seed).filter(([, value]) => value !== undefined),
    ) as typeof seed;
    igrpSetAccessClientConfig({
      ...defined,
      baseUrl: seed.baseUrl || current.baseUrl || process.env.IGRP_ACCESS_MANAGEMENT_API || '',
    });
    return igrpGetAccessClientConfig();
  }
  if (current.token) return current;

  // No ALS store established (Server Action / Route Handler), or a store seeded
  // with an empty token. Either way the current code path is guaranteed to
  // fail, so recovering here cannot regress a working caller.
  //
  // Establish the store SYNCHRONOUSLY, before the first await, so the object
  // lives in the CALLER's async context; the write after the await then mutates
  // that same object in place. Seeding only after the await relies on
  // `enterWith` propagating out of a nested async frame, which did not hold in
  // practice (see the T3 case in __tests__/permissions-action-context.test.ts).
  // This is also why the synchronous prologue must stay ahead of the first
  // `await` in THIS function — an async function body runs synchronously up to
  // its first await, in its caller's context.
  const baseUrl = current.baseUrl || process.env.IGRP_ACCESS_MANAGEMENT_API || '';
  igrpSetAccessClientConfig({ token: '', baseUrl });

  const token = await recoverAccessToken();
  // Sequential, not Promise.all: vitest's mock registry falls through to the real
  // `next/headers` when two dynamic imports of it overlap.
  const locale = current.locale ? undefined : await recoverLocaleFromRequest();
  if (token || locale) {
    // Seed the token too: a caller that needs claims almost always needs the
    // Access Management client next, and that fails in exactly the same
    // contexts for the same reason.
    igrpSetAccessClientConfig({ token: token || '', baseUrl, ...(locale ? { locale } : {}) });
  }

  return igrpGetAccessClientConfig();
}

/**
 * Resolve the current request's permission claims. Bypass → super-admin mock
 * (does NOT attempt to decode the non-JWT preview token). Otherwise decode the
 * per-request access token; a decode failure becomes a distinguishable error
 * state (never silently "no permissions"). Deduped per render via React.cache.
 *
 * Works in Server Actions and Route Handlers as well as renders: when no
 * `AsyncLocalStorage` store was established, the token is recovered through the
 * app's session read (or, without one, the session cookie) and the store is
 * seeded — see `recoverAccessToken`.
 */
// Deduped per request — Next.js resets React's cache() boundary each request,
// so reading process.env (via isIgrpAuthBypass) inside is per-request, not stale.
export const igrpGetClaims = cache(async function igrpGetClaims(): Promise<IGRPClaimsState> {
  if (isIgrpAuthBypass()) {
    // Fail closed in production even if the app never wired the instrumentation guard.
    igrpAssertAuthBypassAllowed();
    return { status: 'ok', claims: { ...SUPER_ADMIN_MOCK } };
  }
  try {
    const { token } = await igrpEnsureAccessClientConfig();
    const claims = decodeIgrpClaims(token);

    // An access token recovered straight from the session cookie (no session
    // reader registered, or the read failed) has NOT been through the `jwt`
    // callback — `getToken` decrypts, it does not refresh — so it can be past `exp`. Honouring its permissions would mean a
    // revoked role keeps working until the COOKIE expires rather than the
    // token. Fail closed, distinguishably: `status: 'error'` already denies
    // everywhere, and the client session watcher is what recovers the user.
    if (claimsExpired(claims)) {
      return {
        status: 'error',
        error:
          'access token expired — claims refused. IGRPSessionWatcher schedules a ' +
          'silent refresh from `session.expiresAt`; if this persists, check that ' +
          'the watcher is mounted and that the IdP is still issuing refresh tokens.',
      };
    }

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

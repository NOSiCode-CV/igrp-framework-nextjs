'use server';

import { unstable_rethrow } from 'next/navigation';

import { fetchAppByCode, fetchAppsByUser } from '../hooks/use-applications.js';
import { fetchMenus } from '../hooks/use-menus.js';
import { fetchCurrentUser } from '../hooks/use-user.js';
import { igrpGetAccessClient } from '../lib/api-client.js';
import { igrpEnsureAccessClientConfig, isIgrpAuthBypass } from '../lib/permissions.js';
import { logger } from '../logger.js';

/**
 * Machine-stable failure codes. Show users the translation, not `error` (pt-PT,
 * kept for logs and backwards compatibility): next-intl `errors.actions.<code>`
 * in the framework messages.
 */
export type IGRPActionErrorCode =
  | 'SESSION_INVALID'
  | 'MENUS_LOAD_FAILED'
  | 'USER_LOAD_FAILED'
  | 'APPS_LOAD_FAILED'
  | 'APP_LOAD_FAILED';

export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string; code: IGRPActionErrorCode };

/**
 * Every export of this module is a Server Action, i.e. a POST endpoint
 * addressable by action id from any browser that can reach the app.
 *
 * Two things follow, and they have to be fixed together:
 *
 *  1. **The store is empty here.** Access-management credentials live in an
 *     `AsyncLocalStorage` store that only the layout/DAL render path seeds. A
 *     Server Action is a fresh async context, so without recovery these actions
 *     built a client with `baseUrl: ''` and `Authorization: Bearer ` and failed
 *     with an opaque fetch error instead of a 401. They only ever worked
 *     because their sole caller invoked them during a render.
 *
 *  2. **Recovery alone would open them up.** `fetchMenusAction(appCode)` and
 *     `fetchAppByCodeAction(appCode)` take a caller-supplied application code.
 *     Once a token is reachable, an unauthenticated POST stops failing — so the
 *     guard below refuses before any AM call when no session can be recovered.
 *     Access Management remains the authority on *which* menus/apps the bearer
 *     may see; this only establishes that there is a bearer at all.
 *
 * Returns `null` when the caller is authenticated (or auth is bypassed), and a
 * ready-made failure result otherwise.
 */
// These are unauthenticated-reachable endpoints, so the refusal path is
// exactly the one a caller can drive in a loop. Log it once per process rather
// than once per request — a rejected POST must not be able to flood the log.
let warnedNoSession = false;

async function requireSession(): Promise<Extract<ActionResult<never>, { ok: false }> | null> {
  if (isIgrpAuthBypass()) return null;
  const { token } = await igrpEnsureAccessClientConfig();
  if (token) return null;
  if (!warnedNoSession) {
    warnedNoSession = true;
    logger.warn(
      '[igrp-actions] pedido sem sessão válida — recusado antes de contactar o AM. ' +
        '(aviso emitido uma vez por processo)',
    );
  }
  return { ok: false, error: 'Sessão inválida ou expirada.', code: 'SESSION_INVALID' };
}

export async function fetchMenusAction(
  appCode: string,
): Promise<ActionResult<Awaited<ReturnType<typeof fetchMenus>>>> {
  const denied = await requireSession();
  if (denied) return denied;
  try {
    const data = await fetchMenus(appCode);
    return { ok: true, data };
  } catch (error) {
    // fetchMenus() calls next/navigation's redirect() on 401/403, which signals
    // via a thrown NEXT_REDIRECT error. unstable_rethrow lets that (and other
    // internal Next control-flow errors) propagate instead of being flattened
    // into a generic ActionResult failure below.
    unstable_rethrow(error);
    logger.error('[fetchMenusAction] Falha ao carregar os menus:', error);
    return { ok: false, error: 'Falha ao carregar os menus.', code: 'MENUS_LOAD_FAILED' };
  }
}

export async function fetchCurrentUserAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof fetchCurrentUser>>>
> {
  const denied = await requireSession();
  if (denied) return denied;
  try {
    const data = await fetchCurrentUser();
    return { ok: true, data };
  } catch (error) {
    unstable_rethrow(error);
    logger.error('[fetchCurrentUserAction] Falha ao carregar os dados do utilizador:', error);
    return {
      ok: false,
      error: 'Falha ao carregar os dados do utilizador.',
      code: 'USER_LOAD_FAILED',
    };
  }
}

export async function fetchAppsByUserAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof fetchAppsByUser>>>
> {
  const denied = await requireSession();
  if (denied) return denied;
  try {
    const data = await fetchAppsByUser();
    return { ok: true, data };
  } catch (error) {
    unstable_rethrow(error);
    logger.error('[fetchAppsByUserAction] Falha ao carregar as aplicações:', error);
    return { ok: false, error: 'Falha ao carregar as aplicações.', code: 'APPS_LOAD_FAILED' };
  }
}

export async function fetchAppByCodeAction(
  appCode: string,
): Promise<ActionResult<Awaited<ReturnType<typeof fetchAppByCode>>>> {
  const denied = await requireSession();
  if (denied) return denied;
  try {
    const data = await fetchAppByCode(appCode);
    return { ok: true, data };
  } catch (error) {
    unstable_rethrow(error);
    logger.error('[fetchAppByCodeAction] Falha ao carregar os dados da aplicação:', error);
    return {
      ok: false,
      error: 'Falha ao carregar os dados da aplicação.',
      code: 'APP_LOAD_FAILED',
    };
  }
}

/**
 * `reason` is AM's `closed_reason` passed through (`USER_LOGOUT`,
 * `SESSION_LIMIT_EXCEEDED`, `IDLE_TIMEOUT`, …); an open set, so a string.
 */
export type IGRPAccessSessionCheck = { valid: boolean; reason?: string | null };

/**
 * Asks Access Management whether this app's session is still alive, for a tab
 * that regains focus. `GET /api/session/check` skips AM's session filter, so a
 * revoked session answers `valid: false` with a reason instead of a 401.
 *
 * Only an explicit `valid: false` ends the session. Auth bypass, no session to
 * check, and every failure (AM down, timeout, a 401 for an expired access token
 * the next refresh will replace) answer `valid: true`: an outage must never
 * sign users out, and the 401 path of the next real AM call still catches a
 * dead session.
 */
export async function igrpCheckAccessSession(): Promise<IGRPAccessSessionCheck> {
  if (isIgrpAuthBypass()) return { valid: true };
  const { token } = await igrpEnsureAccessClientConfig();
  if (!token) return { valid: true };
  try {
    const { data } = await igrpGetAccessClient().sessions.checkSession();
    if (data.valid) return { valid: true };
    logger.info('[igrpCheckAccessSession] sessão terminada no AM', { reason: data.reason ?? null });
    return { valid: false, reason: data.reason ?? null };
  } catch (error) {
    logger.warn('[igrpCheckAccessSession] verificação da sessão falhou; mantida como válida', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { valid: true };
  }
}

// use-menus/use-applications/use-user intentionally use React.cache() rather
// than fetch()/unstable_cache() tags (see CHANGELOG — tag-based caching used
// to embed rotating access tokens in the cache key, causing stale 401s).
// React.cache() is request-scoped, so there is no tagged cache entry for these
// functions to invalidate; freshness after a mutation comes from the caller's
// router.refresh() (see useLayoutData), which forces a new request and a new
// React.cache() scope. These two actions are kept as no-ops purely for public
// API stability — do not reintroduce revalidateTag() here without also
// reintroducing tagged fetch/unstable_cache calls in the hooks above.
//
// `useLayoutData` no longer awaits them: a round-trip to a documented no-op
// only delays the router.refresh() that does the actual work.
/** @deprecated No-op. Call `router.refresh()` instead. */
export async function revalidateMenusAction(_appCode: string): Promise<void> {}

/** @deprecated No-op. Call `router.refresh()` instead. */
export async function revalidateAppsAction(): Promise<void> {}

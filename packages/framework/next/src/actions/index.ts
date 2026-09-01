'use server';

import { unstable_rethrow } from 'next/navigation';

import { fetchAppByCode, fetchAppsByUser } from '../hooks/use-applications';
import { fetchMenus } from '../hooks/use-menus';
import { fetchCurrentUser } from '../hooks/use-user';
import { logger } from '../logger';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchMenusAction(
  appCode: string,
): Promise<ActionResult<Awaited<ReturnType<typeof fetchMenus>>>> {
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
    return { ok: false, error: 'Falha ao carregar os menus.' };
  }
}

export async function fetchCurrentUserAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof fetchCurrentUser>>>
> {
  try {
    const data = await fetchCurrentUser();
    return { ok: true, data };
  } catch (error) {
    unstable_rethrow(error);
    logger.error('[fetchCurrentUserAction] Falha ao carregar os dados do utilizador:', error);
    return { ok: false, error: 'Falha ao carregar os dados do utilizador.' };
  }
}

export async function fetchAppsByUserAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof fetchAppsByUser>>>
> {
  try {
    const data = await fetchAppsByUser();
    return { ok: true, data };
  } catch (error) {
    unstable_rethrow(error);
    logger.error('[fetchAppsByUserAction] Falha ao carregar as aplicações:', error);
    return { ok: false, error: 'Falha ao carregar as aplicações.' };
  }
}

export async function fetchAppByCodeAction(
  appCode: string,
): Promise<ActionResult<Awaited<ReturnType<typeof fetchAppByCode>>>> {
  try {
    const data = await fetchAppByCode(appCode);
    return { ok: true, data };
  } catch (error) {
    unstable_rethrow(error);
    logger.error('[fetchAppByCodeAction] Falha ao carregar os dados da aplicação:', error);
    return { ok: false, error: 'Falha ao carregar os dados da aplicação.' };
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
export async function revalidateMenusAction(_appCode: string): Promise<void> {}

export async function revalidateAppsAction(): Promise<void> {}

'use server';

import { revalidateTag } from 'next/cache';

import { fetchAppByCode, fetchAppsByUser } from '../hooks/use-applications';
import { fetchMenus } from '../hooks/use-menus';
import { fetchCurrentUser } from '../hooks/use-user';
import { logger } from '../logger';

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchMenusAction(appCode: string): Promise<ActionResult<Awaited<ReturnType<typeof fetchMenus>>>> {
  try {
    const data = await fetchMenus(appCode);
    return { ok: true, data };
  } catch (error) {
    logger.error('[fetchMenusAction] Falha ao carregar os menus:', error);
    return { ok: false, error: 'Falha ao carregar os menus.' };
  }
}

export async function fetchCurrentUserAction(): Promise<ActionResult<Awaited<ReturnType<typeof fetchCurrentUser>>>> {
  try {
    const data = await fetchCurrentUser();
    return { ok: true, data };
  } catch (error) {
    logger.error('[fetchCurrentUserAction] Falha ao carregar os dados do utilizador:', error);
    return { ok: false, error: 'Falha ao carregar os dados do utilizador.' };
  }
}

export async function fetchAppsByUserAction(): Promise<ActionResult<Awaited<ReturnType<typeof fetchAppsByUser>>>> {
  try {
    const data = await fetchAppsByUser();
    return { ok: true, data };
  } catch (error) {
    logger.error('[fetchAppsByUserAction] Falha ao carregar as aplicações:', error);
    return { ok: false, error: 'Falha ao carregar as aplicações.' };
  }
}

export async function fetchAppByCodeAction(appCode: string): Promise<ActionResult<Awaited<ReturnType<typeof fetchAppByCode>>>> {
  try {
    const data = await fetchAppByCode(appCode);
    return { ok: true, data };
  } catch (error) {
    logger.error('[fetchAppByCodeAction] Falha ao carregar os dados da aplicação:', error);
    return { ok: false, error: 'Falha ao carregar os dados da aplicação.' };
  }
}

export async function revalidateMenusAction(appCode: string): Promise<void> {
  revalidateTag(`igrp-menus-${appCode}`);
}

export async function revalidateAppsAction(): Promise<void> {
  revalidateTag('igrp-apps');
}

export async function revalidateUserAction(): Promise<void> {
  // User cache is keyed by session token, not a revalidatable tag.
  // This action is a no-op on the server; the client must call router.refresh()
  // after invoking it to trigger an RSC re-render with the new session token.
}

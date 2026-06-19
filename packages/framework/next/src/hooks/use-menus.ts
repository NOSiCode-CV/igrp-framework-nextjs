import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperMenus } from '../mappers/menus-mapper';
import { logger } from '../logger';

async function fetchMenusRaw(appCode: string, token: string, baseUrl: string) {
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUserApplicationMenus(appCode);
  return mapperMenus(result);
}

// One unstable_cache wrapper per appCode — preserves dynamic 'igrp-menus-${appCode}'
// revalidation tag required by revalidateMenusAction.
// Capped at MAX_CACHE_ENTRIES to prevent unbounded memory growth on long-running servers.
const MAX_CACHE_ENTRIES = 50;
const _menuCaches = new Map<
  string,
  (token: string, baseUrl: string) => ReturnType<typeof fetchMenusRaw>
>();

function getMenuCache(appCode: string) {
  if (!_menuCaches.has(appCode)) {
    if (_menuCaches.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = _menuCaches.keys().next().value;
      if (oldestKey !== undefined) _menuCaches.delete(oldestKey);
    }
    _menuCaches.set(
      appCode,
      unstable_cache(
        (token: string, baseUrl: string) => fetchMenusRaw(appCode, token, baseUrl),
        ['igrp-menus', appCode],
        { tags: [`igrp-menus-${appCode}`], revalidate: 300 },
      ),
    );
  }
  return _menuCaches.get(appCode)!;
}

export async function fetchMenus(appCode: string) {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    return await getMenuCache(appCode)(token, baseUrl);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = h.get('x-current-path');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    logger.error('[igrp-menus] Erro ao carregar os menus da aplicação.', error);
    return [];
  }
}

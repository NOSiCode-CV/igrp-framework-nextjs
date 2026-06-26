import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { sanitizeRedirectUrl } from '@igrp/framework-next-auth/sanitize';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperApplications } from '../mappers/applications-mapper';
import { logger } from '../logger';

async function fetchAppsByUserRaw(token: string, baseUrl: string) {
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUserApplications();
  return mapperApplications(result);
}

async function fetchAppByCodeRaw(appCode: string, token: string, baseUrl: string) {
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.applications.getApplications({ code: appCode });
  return mapperApplications(result)[0] ?? null;
}

// Hoisted: static tag 'igrp-apps' allows module-level declaration.
const getCachedAppsByUser = unstable_cache(fetchAppsByUserRaw, ['igrp-apps'], {
  tags: ['igrp-apps'],
  revalidate: 300,
});

// One unstable_cache wrapper per appCode — created lazily, stored in a Map.
// Capped at MAX_CACHE_ENTRIES to prevent unbounded memory growth.
const MAX_CACHE_ENTRIES = 50;
const _appByCodeCaches = new Map<
  string,
  (token: string, baseUrl: string) => ReturnType<typeof fetchAppByCodeRaw>
>();

function getAppByCodeCache(appCode: string) {
  if (!_appByCodeCaches.has(appCode)) {
    if (_appByCodeCaches.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = _appByCodeCaches.keys().next().value;
      if (oldestKey !== undefined) _appByCodeCaches.delete(oldestKey);
    }
    _appByCodeCaches.set(
      appCode,
      unstable_cache(
        (token: string, baseUrl: string) => fetchAppByCodeRaw(appCode, token, baseUrl),
        ['igrp-app-by-code', appCode],
        { tags: [`igrp-app-${appCode}`], revalidate: 300 },
      ),
    );
  }
  return _appByCodeCaches.get(appCode)!;
}

export async function fetchAppsByUser() {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    return await getCachedAppsByUser(token, baseUrl);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    logger.error('[apps-by-user] Erro ao carregar os dados da aplicação.', error);
    return [];
  }
}

export async function fetchAppByCode(appCode: string) {
  try {
    if (!appCode)
      throw new Error(
        '[app-by-code]: O Modo de Visualização não está ativo. Quando está desativado, é necessário indicar o código da aplicação. Não foi encontrado nenhum código da aplicação.',
      );
    const { token, baseUrl } = igrpGetAccessClientConfig();
    return await getAppByCodeCache(appCode)(token, baseUrl);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    logger.error('[app-by-code] Não foi possível obter os dados da aplicação.', error);
    return null;
  }
}

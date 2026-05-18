import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperApplications } from '../mappers/applications-mapper';

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
// token + baseUrl become part of the cache key via function arguments.
const getCachedAppsByUser = unstable_cache(fetchAppsByUserRaw, ['igrp-apps'], {
  tags: ['igrp-apps'],
  revalidate: 300,
});

// One unstable_cache wrapper per appCode — created lazily, stored in a Map so
// the wrapper is stable across calls for the same app. This preserves the
// dynamic 'igrp-app-${appCode}' revalidation tag required for targeted invalidation.
const _appByCodeCaches = new Map<
  string,
  (token: string, baseUrl: string) => ReturnType<typeof fetchAppByCodeRaw>
>();

function getAppByCodeCache(appCode: string) {
  if (!_appByCodeCaches.has(appCode)) {
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
      redirect('/login');
    }
    console.error('[apps-by-user] Erro ao carregar os dados da aplicação.:', error);
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
      redirect('/login');
    }
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    return null;
  }
}

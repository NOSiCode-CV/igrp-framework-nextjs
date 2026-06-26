import { cache } from 'react';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sanitizeRedirectUrl } from '@igrp/framework-next-auth/sanitize';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperApplications } from '../mappers/applications-mapper';
import { logger } from '../logger';

const getCachedAppsByUser = cache(async function fetchAppsByUserOnce() {
  const { token, baseUrl } = igrpGetAccessClientConfig();
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUserApplications();
  return mapperApplications(result);
});

const getCachedAppByCode = cache(async function fetchAppByCodeOnce(appCode: string) {
  const { token, baseUrl } = igrpGetAccessClientConfig();
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.applications.getApplications({ code: appCode });
  return mapperApplications(result)[0] ?? null;
});

export async function fetchAppsByUser() {
  try {
    return await getCachedAppsByUser();
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
    return await getCachedAppByCode(appCode);
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

import { cache } from 'react';
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

export const fetchAppsByUser = cache(async () => {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    const cached = unstable_cache(
      async () => fetchAppsByUserRaw(token, baseUrl),
      ['igrp-apps', token],
      { tags: ['igrp-apps'], revalidate: 300 },
    );
    return await cached();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[apps-by-user] Erro ao carregar os dados da aplicação.:', error);
    return [];
  }
});

export const fetchAppByCode = cache(async (appCode: string) => {
  try {
    if (!appCode)
      throw new Error(
        '[app-by-code]: O Modo de Visualização não está ativo. Quando está desativado, é necessário indicar o código da aplicação. Não foi encontrado nenhum código da aplicação.',
      );
    const { token, baseUrl } = igrpGetAccessClientConfig();
    const cached = unstable_cache(
      async () => fetchAppByCodeRaw(appCode, token, baseUrl),
      ['igrp-app-by-code', appCode, token],
      { tags: [`igrp-app-${appCode}`], revalidate: 300 },
    );
    return await cached();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    return null;
  }
});

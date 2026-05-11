import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';

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
  logger.info('fetchMenusRaw', { result });
  return mapperMenus(result);
}

export const fetchMenus = cache(async (appCode: string) => {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    const cached = unstable_cache(
      async () => fetchMenusRaw(appCode, token, baseUrl),
      ['igrp-menus', appCode, token],
      { tags: [`igrp-menus-${appCode}`], revalidate: 300 },
    );
    return await cached();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[igrp-menus]: Erro ao carregar os menus da aplicação.:', error);
    return [];
  }
});

import { cache } from 'react';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sanitizeRedirectUrl } from '@igrp/framework-next-auth/sanitize';

import { igrpGetAccessClientConfig } from '../lib/api-config';
import { mapperMenus } from '../mappers/menus-mapper';
import { logger } from '../logger';

// Per-request dedup via React cache. The token is read INSIDE the cached fn (not
// passed as an argument), so it is never embedded in a cross-request cache key
// and per-user menus are never shared across requests. See use-user.ts.
const getCachedMenus = cache(async function fetchMenusOnce(appCode: string) {
  const { token, baseUrl } = igrpGetAccessClientConfig();
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUserApplicationMenus(appCode);
  return mapperMenus(result);
});

export async function fetchMenus(appCode: string) {
  try {
    return await getCachedMenus(appCode);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    logger.error('[igrp-menus] Erro ao carregar os menus da aplicação.', error);
    return [];
  }
}

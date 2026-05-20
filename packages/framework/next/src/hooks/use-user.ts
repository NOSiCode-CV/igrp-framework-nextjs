import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { igrpGetAccessClientConfig } from '../lib/api-config';

async function fetchCurrentUserRaw(token: string, baseUrl: string) {
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUser();
  return result.data;
}

// Hoisted: one stable wrapper for the lifetime of the process.
// token + baseUrl are passed as args and become part of the cache key automatically.
const getCachedCurrentUser = unstable_cache(fetchCurrentUserRaw, ['igrp-user'], {
  revalidate: 60,
});

export async function fetchCurrentUser() {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    return await getCachedCurrentUser(token, baseUrl);
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = h.get('x-current-path');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    console.error('[igrp-user] Erro ao carregar os dados do utilizador atual.:', error);
    return null;
  }
}

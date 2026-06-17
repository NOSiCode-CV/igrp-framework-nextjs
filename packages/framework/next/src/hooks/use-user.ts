import { cache } from 'react';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { igrpGetAccessClientConfig } from '../lib/api-config';

// Per-request deduplication via React cache.
//
// unstable_cache was removed here because it embeds the access token inside the
// cache key (token is a function argument). When the token rotates after a
// refresh, the old cache entry stays alive and Next.js background-revalidates
// it with the expired token → 401s in logs and, if the stale entry has been
// evicted, user-visible errors. React cache() deduplicates within an RSC
// render tree, which is all we need — the token changes on every refresh anyway,
// so cross-request caching by token value has no hit rate.
const getCachedCurrentUser = cache(async function fetchCurrentUserOnce() {
  const { token, baseUrl } = igrpGetAccessClientConfig();
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: 10_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await client.users.getCurrentUser();
  return result.data;
});

export async function fetchCurrentUser() {
  try {
    return await getCachedCurrentUser();
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

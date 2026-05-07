import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { ApiClientError, AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';

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

export const fetchCurrentUser = cache(async () => {
  try {
    const { token, baseUrl } = igrpGetAccessClientConfig();
    const cached = unstable_cache(
      async () => fetchCurrentUserRaw(token, baseUrl),
      ['igrp-user', token],
      { revalidate: 60 },
    );
    return await cached();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      redirect('/login');
    }
    console.error('[igrp-user] Erro ao carregar os dados do utilizador atual.:', error);
    return null;
  }
});

import 'server-only';

import { cache } from 'react';
import { ApiClientError } from '@igrp/platform-access-management-client-ts';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { sanitizeRedirectUrl } from '@igrp/framework-next-auth/sanitize';

import { igrpGetAccessClient } from '../lib/api-client.js';
import { mapUserDTO } from '../mappers/users-mapper.js';
import { logger } from '../logger.js';

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
  const client = igrpGetAccessClient();
  const result = await client.users.getCurrentUser();
  // Narrow at the fetch boundary, not at the render site. Both callers hand
  // this straight to a `'use client'` component, so anything returned here is
  // serialized into the RSC payload — returning `result.data` shipped the whole
  // `IGRPUserDTO` (including the server-owned `metadata` bag) to the browser.
  // It type-checked because the DTO is assignable to `IGRPUserArgs`; see
  // `mapUserDTO`.
  return result.data ? mapUserDTO(result.data) : null;
});

export async function fetchCurrentUser() {
  try {
    return await getCachedCurrentUser();
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      const h = await headers();
      const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
      redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
    }
    // Non-auth failure (timeout / network / 5xx): surface it so the layout's
    // error boundary engages instead of rendering a null user that looks like
    // an unauthenticated state. The action layer (actions/index.ts) catches
    // this into ActionResult; SidebarDataProvider propagates to its boundary.
    logger.error('[igrp-user] Erro ao carregar os dados do utilizador atual.', error);
    throw error;
  }
}

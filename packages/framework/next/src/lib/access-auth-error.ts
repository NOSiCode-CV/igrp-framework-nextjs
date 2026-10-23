import 'server-only';

import { ApiClientError } from '@igrp/platform-access-management-client-ts';
import { forbidden, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sanitizeRedirectUrl } from '@igrp/framework-next-auth/sanitize';

import { logger } from '../logger.js';

/**
 * Maps an Access Management auth failure to Next control flow: 401 ends the
 * local session (the login page clears it on `reason=session_ended`), 403
 * renders `forbidden()`. Any other error returns so the caller can rethrow it.
 * The 401 reason is logged, never branched on.
 */
export async function igrpThrowOnAccessAuthError(error: unknown): Promise<void> {
  if (!(error instanceof ApiClientError)) return;
  if (error.status === 403) forbidden();
  if (error.status !== 401) return;

  logger.warn('[igrp-am] Access Management respondeu 401.', {
    reason: error.details?.error_description,
  });
  const h = await headers();
  const callbackUrl = sanitizeRedirectUrl(h.get('x-current-path'), undefined, '');
  redirect(
    callbackUrl
      ? `/login?reason=session_ended&callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login?reason=session_ended',
  );
}

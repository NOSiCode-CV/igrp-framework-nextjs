import 'server-only';

import { AccessManagementClient } from '@igrp/platform-access-management-client-ts';
import { igrpGetAccessClientConfig, igrpResetAccessClientConfig } from './api-config.js';

export function igrpGetAccessClient(): AccessManagementClient {
  const { baseUrl, token, timeout, locale } = igrpGetAccessClientConfig();
  if (!baseUrl || !token) {
    throw new Error(
      'Access Management client is not configured. Call igrpSetAccessClientConfig() first.',
    );
  }
  const client = AccessManagementClient.create({
    baseUrl,
    timeout: timeout ?? 10_000,
    headers: { Authorization: `Bearer ${token}`, ...(locale ? { 'Accept-Language': locale } : {}) },
  });
  guardSessionClient(client.sessions);
  return client;
}

/**
 * `sessions.closeSession()` looks like a session lifecycle helper but is a trap
 * in an IGRP app, so it warns the first time it is called in this process. It
 * still runs — nothing that calls it today breaks.
 *
 * `closeSession` (`POST /api/session/close`) ends the session server-side but is
 * NOT a logout: it clears no cookie, does not end the SSO session and revokes no
 * token. Log out through the template's /logout flow (`end_session` with
 * `id_token_hint`).
 */
const SESSION_CLIENT_TRAPS = {
  closeSession:
    'sessions.closeSession() is not a logout: it clears no cookie, keeps the SSO session and ' +
    'revokes no token. Sign out through the /logout flow (end_session with id_token_hint).',
} as const;

const warnedSessionTraps = new Set<string>();

function guardSessionClient(sessions: AccessManagementClient['sessions'] | undefined): void {
  if (!sessions) return;
  for (const [method, message] of Object.entries(SESSION_CLIENT_TRAPS)) {
    const original = (sessions as unknown as Record<string, unknown>)[method];
    if (typeof original !== 'function') continue;
    (sessions as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
      if (!warnedSessionTraps.has(method)) {
        warnedSessionTraps.add(method);
        console.warn(`[igrpGetAccessClient] ${message}`);
      }
      return (original as (...a: unknown[]) => unknown).apply(sessions, args);
    };
  }
}

/**
 * @deprecated Misnamed: there is no client cache to reset — `igrpGetAccessClient`
 * builds a fresh client per call. This only clears the per-request *config*.
 * Call {@link igrpResetAccessClientConfig} directly, which says what it does.
 */
export function igrpResetAccessClient(): void {
  igrpResetAccessClientConfig();
}

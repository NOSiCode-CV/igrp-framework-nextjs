import { afterEach, describe, expect, it } from 'vitest';

import { readIGRPServerSessionAccessToken, registerIGRPServerSession } from '../session-store';

/**
 * The process-wide session reader that `@igrp/framework-next`'s permission
 * checks use instead of the stale cookie (see `recoverAccessToken` there).
 */

const ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
  NEXTAUTH_SECRET: 'test-secret-key',
  NEXTAUTH_URL: 'http://localhost:3000/api/auth',
};

/** The slot `registerIGRPServerSession` writes, read straight from `globalThis`. */
function registeredReader(): unknown {
  const slot = (globalThis as unknown as Record<symbol, { read: unknown } | undefined>)[
    Symbol.for('igrp.next-auth.serverSession')
  ];
  return slot?.read ?? null;
}

afterEach(() => registerIGRPServerSession(null));

describe('readIGRPServerSessionAccessToken', () => {
  it('is undefined when no reader is registered, so the caller can fall back', async () => {
    expect(await readIGRPServerSessionAccessToken()).toBeUndefined();
  });

  it("returns the session's access token", async () => {
    registerIGRPServerSession(async () => ({ accessToken: 'fresh' }));
    expect(await readIGRPServerSessionAccessToken()).toBe('fresh');
  });

  it("is '' for no session, a failed refresh, or a session without a string token", async () => {
    registerIGRPServerSession(async () => null);
    expect(await readIGRPServerSessionAccessToken()).toBe('');
    registerIGRPServerSession(async () => ({
      accessToken: 'stale',
      error: 'RefreshAccessTokenError',
    }));
    expect(await readIGRPServerSessionAccessToken()).toBe('');
    registerIGRPServerSession(async () => ({ accessToken: 42 }));
    expect(await readIGRPServerSessionAccessToken()).toBe('');
  });

  it('propagates a failed read', async () => {
    const failure = new Error('read failed');
    registerIGRPServerSession(async () => {
      throw failure;
    });
    await expect(readIGRPServerSessionAccessToken()).rejects.toBe(failure);
  });
});

describe('withIGRPAuth registration', () => {
  it("registers the instance's serverSession", async () => {
    const { withIGRPAuth } = await import('../config');
    const auth = withIGRPAuth({ env: ENV });
    expect(registeredReader()).toBe(auth.serverSession);
  });

  it('registers nothing when auth is disabled', async () => {
    const { withIGRPAuth } = await import('../config');
    withIGRPAuth({ env: { ...ENV, AUTH_PROVIDER: 'none' } });
    expect(registeredReader()).toBeNull();
  });
});

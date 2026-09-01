import { beforeEach, describe, expect, it, vi } from 'vitest';

// Spy on getToken so we can assert how getAccessToken / getTokenFromRequest
// resolve the session-cookie name. Returning null mirrors the real-world bug:
// when the wrong cookie name is requested, getToken finds nothing.
const getTokenMock = vi.fn();
vi.mock('next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => getTokenMock(...args),
}));

// next/headers is dynamically imported inside getAccessToken.
let cookieList: Array<{ name: string; value: string }> = [];
vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: () => cookieList }),
}));

const VALID_ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
  NEXTAUTH_SECRET: 'test-secret-key',
  // Deliberately NOT https — reproduces the proxy/standalone deployment where
  // the cookie is written as __Secure-… (via x-forwarded-proto) but NEXTAUTH_URL
  // at the Node runtime is http/unset.
  NEXTAUTH_URL: 'http://localhost:3000/api/auth',
};

async function getFactory() {
  const { withIGRPAuth } = await import('../config');
  return withIGRPAuth;
}

describe('getAccessToken — session-cookie name resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieList = [];
    getTokenMock.mockResolvedValue(null);
  });

  it('requests the secure cookie name when a __Secure- session cookie is present', async () => {
    const withIGRPAuth = await getFactory();
    const auth = withIGRPAuth({ env: VALID_ENV });
    cookieList = [{ name: '__Secure-next-auth.session-token', value: 'enc' }];

    await auth.getAccessToken();

    expect(getTokenMock).toHaveBeenCalledTimes(1);
    expect(getTokenMock.mock.calls[0]?.[0]).toMatchObject({ secureCookie: true });
  });

  it('requests the non-secure cookie name when a plain session cookie is present', async () => {
    const withIGRPAuth = await getFactory();
    const auth = withIGRPAuth({ env: VALID_ENV });
    cookieList = [{ name: 'next-auth.session-token', value: 'enc' }];

    await auth.getAccessToken();

    expect(getTokenMock.mock.calls[0]?.[0]).toMatchObject({ secureCookie: false });
  });

  it('handles chunked __Secure- session cookies', async () => {
    const withIGRPAuth = await getFactory();
    const auth = withIGRPAuth({ env: VALID_ENV });
    cookieList = [
      { name: '__Secure-next-auth.session-token.0', value: 'a' },
      { name: '__Secure-next-auth.session-token.1', value: 'b' },
    ];

    await auth.getAccessToken();

    expect(getTokenMock.mock.calls[0]?.[0]).toMatchObject({ secureCookie: true });
  });
});

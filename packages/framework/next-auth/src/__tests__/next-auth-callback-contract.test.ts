import { describe, it, expect, vi, afterEach } from 'vitest';
import NextAuth from 'next-auth';

/**
 * Pins the contract of the LIBRARY that `withIGRPAuth`'s default
 * `callbacks.redirect` depends on: next-auth v4 hands that callback ONLY the
 * origin as `baseUrl` — never the path of NEXTAUTH_URL (basePath + /api/auth).
 *
 * Driven through next-auth's public Pages-API entry (a pure function of
 * req/res, so it runs outside Next) which reaches the real
 * `createCallbackUrl`. If a next-auth upgrade ever changes the shape of
 * `baseUrl`, this fails before users see a 404 after login.
 */
describe('next-auth v4 → callbacks.redirect contract', () => {
  const original = process.env.NEXTAUTH_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = original;
  });

  it('passes the bare origin as baseUrl, dropping the NEXTAUTH_URL path', async () => {
    process.env.NEXTAUTH_URL = 'https://host.example/apps/core/api/auth';
    const redirect = vi.fn().mockResolvedValue('https://host.example/apps/core/');

    const res = {
      status: () => res,
      setHeader: () => res,
      getHeader: () => undefined,
      end: () => res,
      send: () => res,
      json: () => res,
    };

    await (NextAuth as unknown as (req: unknown, res: unknown, o: unknown) => Promise<void>)(
      {
        method: 'GET',
        headers: { host: 'host.example' },
        cookies: {},
        query: { nextauth: ['signin'], callbackUrl: '/dashboard' },
      },
      res,
      {
        secret: 'contract-secret',
        providers: [],
        callbacks: { redirect },
      },
    );

    expect(redirect).toHaveBeenCalled();
    for (const call of redirect.mock.calls) {
      expect(call[0]).toEqual({ url: '/dashboard', baseUrl: 'https://host.example' });
    }
  });
});

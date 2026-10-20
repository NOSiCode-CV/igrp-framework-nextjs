import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Auth cookies of a basePath app live at `Path=<basePath>` under a `_p~` name;
 * older ones sit at `Path=/`. A cookie is only removed by a `Set-Cookie` with
 * the SAME path (and `Secure` for a `__Secure-` name), so the delete must pick
 * the path per name.
 *
 * Co-hosted apps share the cookie jar: a logout page also receives the
 * app-center's `Path=/` cookie and, under the old matcher, deleted it.
 */

const deleted: Array<{ name: string; path: string; secure: boolean }> = [];
let present: string[] = [];

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => present.map((name) => ({ name, value: 'x' })),
    delete: (options: { name: string; path: string; secure: boolean }) => {
      deleted.push(options);
    },
  }),
}));

const { igrpDeleteAuthCookies } = await import('../delete-auth-cookies.js');

beforeEach(() => {
  deleted.length = 0;
  present = [];
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_BASE_PATH;
});

describe('igrpDeleteAuthCookies', () => {
  it("expires this app's current cookies at the basePath and its old names at /", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
    present = [
      '__Secure-next-auth.session-token.apps-a_p~.0',
      '__Secure-next-auth.session-token.apps-a_p~.1',
      'next-auth.session-token.apps-a~',
      'unrelated',
    ];

    await igrpDeleteAuthCookies();

    expect(deleted).toEqual([
      { name: '__Secure-next-auth.session-token.apps-a_p~.0', path: '/apps/a', secure: true },
      { name: '__Secure-next-auth.session-token.apps-a_p~.1', path: '/apps/a', secure: true },
      { name: 'next-auth.session-token.apps-a~', path: '/', secure: false },
    ]);
  });

  it("never deletes another app's session cookie", async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
    present = [
      'next-auth.session-token.apps-a_p~',
      // The app-center's cookie (root path) — reaches every app's logout page.
      '__Secure-next-auth.session-token~',
      '__Secure-next-auth.session-token~.0',
      // Another basePath app (only visible on shared paths, but never ours).
      'next-auth.session-token.apps-ab_p~',
      // A stock-named cookie: an older co-hosted app's, not this one's.
      'next-auth.session-token',
    ];

    await igrpDeleteAuthCookies();

    expect(deleted.map((d) => d.name)).toEqual(['next-auth.session-token.apps-a_p~']);
  });

  it('uses / for a root-path app and leaves basePath apps alone', async () => {
    present = [
      'next-auth.session-token~',
      'next-auth.session-token~.0',
      'next-auth.session-token.apps-a_p~',
      'next-auth.session-token',
    ];

    await igrpDeleteAuthCookies();

    expect(deleted).toEqual([
      { name: 'next-auth.session-token~', path: '/', secure: false },
      { name: 'next-auth.session-token~.0', path: '/', secure: false },
    ]);
  });

  it("sweeps a root app's stock-named orphan only when asked", async () => {
    present = ['next-auth.session-token~', 'next-auth.session-token', 'next-auth.session-token.0'];

    await igrpDeleteAuthCookies(undefined, { sweepStockNames: true });

    expect(deleted.map((d) => d.name)).toEqual([
      'next-auth.session-token~',
      'next-auth.session-token',
      'next-auth.session-token.0',
    ]);
  });
});

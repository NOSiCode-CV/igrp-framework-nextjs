import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Auth cookies of a basePath app live at `Path=<basePath>` under a `_p~` name;
 * older ones sit at `Path=/`. A cookie is only removed by a `Set-Cookie` with
 * the SAME path (and `Secure` for a `__Secure-` name), so the delete must pick
 * the path per name — one per name, since Next keeps a single pending
 * `Set-Cookie` per cookie name.
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
  it('expires current path-scoped cookies at the basePath and older ones at /', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/apps/a';
    present = [
      '__Secure-next-auth.session-token.apps-a_p~.0',
      '__Secure-next-auth.session-token.apps-a_p~.1',
      'next-auth.session-token.apps-a~',
      'next-auth.session-token',
      'unrelated',
    ];

    await igrpDeleteAuthCookies();

    expect(deleted).toEqual([
      { name: '__Secure-next-auth.session-token.apps-a_p~.0', path: '/apps/a', secure: true },
      { name: '__Secure-next-auth.session-token.apps-a_p~.1', path: '/apps/a', secure: true },
      { name: 'next-auth.session-token.apps-a~', path: '/', secure: false },
      { name: 'next-auth.session-token', path: '/', secure: false },
    ]);
  });

  it('uses / for everything in a root-path app', async () => {
    present = ['next-auth.session-token~', 'next-auth.session-token~.0'];

    await igrpDeleteAuthCookies();

    expect(deleted.map((d) => d.path)).toEqual(['/', '/']);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The sibling `session-gate.test.ts` mocks `igrpEnsureAccessClientConfig` — so
 * it proves the gate's *decision* and nothing about the mechanism the decision
 * depends on. That mechanism is the fragile part: `igrpSetAccessClientConfig`
 * uses `AsyncLocalStorage.enterWith`, and the store has to survive
 *
 *   action body → await requireSession() → await igrpEnsureAccessClientConfig()
 *                                        → back out → fetchMenus() reads it
 *
 * i.e. an `enterWith` performed two frames down, observed after an `await` two
 * frames up. That is exactly the T3 case in
 * `lib/__tests__/permissions-action-context.test.ts`, where seeding on the
 * wrong side of an await did NOT propagate. These tests use the real
 * `api-config` and the real `permissions` module so a regression there fails
 * here rather than in production.
 */

const getCurrentUserApplicationMenus = vi.fn();
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  ApiClientError: class extends Error {
    status = 0;
  },
  AccessManagementClient: {
    create: vi.fn((cfg: unknown) => ({
      __cfg: cfg,
      users: { getCurrentUserApplicationMenus },
    })),
  },
}));
vi.mock('../../mappers/menus-mapper.js', () => ({ mapperMenus: (r: { data: unknown }) => r.data }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: () => {} }));
vi.mock('next/headers', () => ({
  headers: async () => ({ get: () => null }),
  cookies: async () => ({ getAll: () => [{ name: 'next-auth.session-token', value: 'opaque' }] }),
}));
vi.mock('react', async (i) => ({ ...(await i<typeof import('react')>()), cache: <T>(f: T) => f }));
vi.mock('@igrp/framework-next-auth/sanitize', () => ({ sanitizeRedirectUrl: () => '' }));

const getToken = vi.fn();
vi.mock('@igrp/framework-next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => getToken(...args),
}));

const { fetchMenusAction } = await import('../index.js');
const { AccessManagementClient } = await import('@igrp/platform-access-management-client-ts');
const { igrpResetAccessClientConfig } = await import('../../lib/api-config.js');

beforeEach(() => {
  igrpResetAccessClientConfig();
  getToken.mockReset();
  getCurrentUserApplicationMenus.mockReset().mockResolvedValue({ data: [{ code: 'M' }] });
  vi.mocked(AccessManagementClient.create).mockClear();
  delete process.env.IGRP_PREVIEW_MODE;
  delete process.env.AUTH_PROVIDER;
  delete process.env.NEXT_PUBLIC_BASE_PATH;
  process.env.NEXTAUTH_SECRET = 's';
  process.env.IGRP_ACCESS_MANAGEMENT_API = 'https://am.example.test';
});

describe('the recovered token reaches the AM client in a Server Action', () => {
  it('seeds the store from the cookie and uses that token downstream', async () => {
    getToken.mockResolvedValue({ accessToken: 'RECOVERED' });

    const result = await fetchMenusAction('APP');

    expect(result).toEqual({ ok: true, data: [{ code: 'M' }] });
    // The point of the test: the client was built with the recovered token and
    // the env base URL, neither of which existed when the action started.
    expect(AccessManagementClient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://am.example.test',
        headers: { Authorization: 'Bearer RECOVERED' },
      }),
    );
  });

  it('refuses without ever constructing a client when no token is recoverable', async () => {
    getToken.mockResolvedValue(null);

    expect(await fetchMenusAction('APP')).toMatchObject({ ok: false });
    expect(AccessManagementClient.create).not.toHaveBeenCalled();
    expect(getCurrentUserApplicationMenus).not.toHaveBeenCalled();
  });
});

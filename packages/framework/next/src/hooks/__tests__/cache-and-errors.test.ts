import { describe, it, expect, vi, beforeEach } from 'vitest';

class ApiClientError extends Error {
  status: number;
  constructor(status: number) {
    super(`status ${status}`);
    this.status = status;
  }
}
const getCurrentUserApplicationMenus = vi.fn().mockResolvedValue({ data: [] });
const create = vi.fn(() => ({ users: { getCurrentUserApplicationMenus } }));
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  ApiClientError,
  AccessManagementClient: { create },
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((u: string) => {
    throw new Error(`NEXT_REDIRECT:${u}`);
  }),
}));
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }) }));
// React cache() is request-scoped; in tests with no render scope it is a pass-through.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: <T>(fn: T) => fn };
});
vi.mock('@igrp/framework-next-auth/sanitize', () => ({ sanitizeRedirectUrl: () => '' }));

const { fetchMenus } = await import('../use-menus');
const { igrpSetAccessClientConfig, igrpResetAccessClientConfig } =
  await import('../../lib/api-config');

describe('fetchMenus reads the token fresh from config (no token in cache key)', () => {
  beforeEach(() => {
    igrpResetAccessClientConfig();
    create.mockClear();
  });

  it('uses the current token, and a rotated token on the next call', async () => {
    igrpSetAccessClientConfig({ token: 'T1', baseUrl: 'http://am' });
    await fetchMenus('app');
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({ headers: { Authorization: 'Bearer T1' } }),
    );

    igrpSetAccessClientConfig({ token: 'T2', baseUrl: 'http://am' });
    await fetchMenus('app');
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({ headers: { Authorization: 'Bearer T2' } }),
    );
  });
});

describe('data hooks throw on non-auth failures (no silent empty render)', () => {
  beforeEach(() => {
    igrpResetAccessClientConfig();
    igrpSetAccessClientConfig({ token: 'T', baseUrl: 'http://am' });
  });

  it('fetchMenus throws on a 500 instead of returning []', async () => {
    getCurrentUserApplicationMenus.mockRejectedValueOnce(new ApiClientError(500));
    await expect(fetchMenus('app')).rejects.toBeInstanceOf(ApiClientError);
  });

  it('fetchMenus still returns the data on success', async () => {
    getCurrentUserApplicationMenus.mockResolvedValueOnce({ data: [] });
    await expect(fetchMenus('app')).resolves.toEqual([]);
  });
});

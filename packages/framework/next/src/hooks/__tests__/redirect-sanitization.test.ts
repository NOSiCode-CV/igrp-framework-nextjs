import { describe, it, expect, vi, beforeEach } from 'vitest';

// Throwable ApiClientError with a status, plus a client whose call rejects 401.
class ApiClientError extends Error {
  status: number;
  constructor(status: number) {
    super(`status ${status}`);
    this.status = status;
  }
}
const getCurrentUserApplicationMenus = vi.fn();
const getCurrentUserApplications = vi.fn();
const getCurrentUser = vi.fn();
const getApplications = vi.fn();
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  ApiClientError,
  AccessManagementClient: {
    create: () => ({
      users: { getCurrentUserApplicationMenus, getCurrentUserApplications, getCurrentUser },
      applications: { getApplications },
    }),
  },
}));

// Capture redirect() targets (redirect throws NEXT_REDIRECT in Next; here we
// record + throw so control flow matches production).
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const forbidden = vi.fn(() => {
  throw new Error('NEXT_FORBIDDEN');
});
vi.mock('next/navigation', () => ({ redirect, forbidden }));

const headerStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => headerStore.get(k) ?? null }),
}));

// unstable_cache returns the fn unchanged so the wrapped call runs inline.
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: <T>(fn: T) => fn };
});

const { fetchMenus } = await import('../use-menus.js');
const { fetchAppsByUser, fetchAppByCode } = await import('../use-applications.js');
const { fetchCurrentUser } = await import('../use-user.js');
const { igrpSetAccessClientConfig, igrpResetAccessClientConfig } =
  await import('../../lib/api-config.js');

// `igrpSetAccessClientConfig` uses `AsyncLocalStorage.enterWith`, which does NOT
// propagate from a `beforeEach` hook into the test body — vitest runs them as
// separate async resources. Seeding in `beforeEach` therefore left the store
// empty for every `it`, and the mocked `AccessManagementClient.create` ignores
// its arguments, so nothing noticed until `igrpGetAccessClient`'s
// "not configured" guard started running on these paths. Seed inside the test.
const AM_CONFIG = { token: 'T', baseUrl: 'http://am' };

describe('framework hooks sanitize x-current-path before /login redirect', () => {
  beforeEach(() => {
    headerStore.clear();
    redirect.mockClear();
    forbidden.mockClear();
    getCurrentUserApplicationMenus.mockReset();
    getCurrentUserApplications.mockReset();
    getCurrentUser.mockReset();
    getApplications.mockReset();
    getCurrentUserApplicationMenus.mockRejectedValue(new ApiClientError(401));
    igrpResetAccessClientConfig();
  });

  it('drops an off-origin x-current-path (no callbackUrl)', async () => {
    igrpSetAccessClientConfig(AM_CONFIG);
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchMenus('app')).rejects.toThrow('NEXT_REDIRECT:/login?reason=session_ended');
    expect(redirect).toHaveBeenCalledWith('/login?reason=session_ended');
  });

  it('keeps a safe relative x-current-path as callbackUrl', async () => {
    igrpSetAccessClientConfig(AM_CONFIG);
    headerStore.set('x-current-path', '/dashboard');
    await expect(fetchMenus('app')).rejects.toThrow(
      'NEXT_REDIRECT:/login?reason=session_ended&callbackUrl=%2Fdashboard',
    );
  });

  it('drops an off-origin x-current-path in fetchAppsByUser (no callbackUrl)', async () => {
    igrpSetAccessClientConfig(AM_CONFIG);
    getCurrentUserApplications.mockRejectedValue(new ApiClientError(401));
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchAppsByUser()).rejects.toThrow('NEXT_REDIRECT:/login?reason=session_ended');
    expect(redirect).toHaveBeenCalledWith('/login?reason=session_ended');
  });

  it('drops an off-origin x-current-path in fetchAppByCode (no callbackUrl)', async () => {
    igrpSetAccessClientConfig(AM_CONFIG);
    getApplications.mockRejectedValue(new ApiClientError(401));
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchAppByCode('app')).rejects.toThrow('NEXT_REDIRECT:/login?reason=session_ended');
    expect(redirect).toHaveBeenCalledWith('/login?reason=session_ended');
  });

  it('drops an off-origin x-current-path in fetchCurrentUser (no callbackUrl)', async () => {
    igrpSetAccessClientConfig(AM_CONFIG);
    getCurrentUser.mockRejectedValue(new ApiClientError(401));
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchCurrentUser()).rejects.toThrow('NEXT_REDIRECT:/login?reason=session_ended');
    expect(redirect).toHaveBeenCalledWith('/login?reason=session_ended');
  });

  it.each([
    ['fetchMenus', () => fetchMenus('app'), getCurrentUserApplicationMenus],
    ['fetchAppsByUser', () => fetchAppsByUser(), getCurrentUserApplications],
    ['fetchAppByCode', () => fetchAppByCode('app'), getApplications],
    ['fetchCurrentUser', () => fetchCurrentUser(), getCurrentUser],
  ])('%s renders forbidden on 403 instead of redirecting', async (_n, call, mock) => {
    igrpSetAccessClientConfig(AM_CONFIG);
    mock.mockRejectedValue(new ApiClientError(403));
    await expect(call()).rejects.toThrow('NEXT_FORBIDDEN');
    expect(forbidden).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('still throws a 500 to the error boundary', async () => {
    igrpSetAccessClientConfig(AM_CONFIG);
    getCurrentUserApplicationMenus.mockRejectedValue(new ApiClientError(500));
    await expect(fetchMenus('app')).rejects.toThrow('status 500');
    expect(redirect).not.toHaveBeenCalled();
    expect(forbidden).not.toHaveBeenCalled();
  });
});

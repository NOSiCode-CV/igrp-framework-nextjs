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
vi.mock('next/navigation', () => ({ redirect }));

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

const { fetchMenus } = await import('../use-menus');
const { fetchAppsByUser, fetchAppByCode } = await import('../use-applications');
const { fetchCurrentUser } = await import('../use-user');

describe('framework hooks sanitize x-current-path before /login redirect', () => {
  beforeEach(() => {
    headerStore.clear();
    redirect.mockClear();
    getCurrentUserApplicationMenus.mockReset();
    getCurrentUserApplications.mockReset();
    getCurrentUser.mockReset();
    getApplications.mockReset();
    getCurrentUserApplicationMenus.mockRejectedValue(new ApiClientError(401));
  });

  it('drops an off-origin x-current-path (no callbackUrl)', async () => {
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchMenus('app')).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('keeps a safe relative x-current-path as callbackUrl', async () => {
    headerStore.set('x-current-path', '/dashboard');
    await expect(fetchMenus('app')).rejects.toThrow(
      'NEXT_REDIRECT:/login?callbackUrl=%2Fdashboard',
    );
  });

  it('drops an off-origin x-current-path in fetchAppsByUser (no callbackUrl)', async () => {
    getCurrentUserApplications.mockRejectedValue(new ApiClientError(401));
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchAppsByUser()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('drops an off-origin x-current-path in fetchAppByCode (no callbackUrl)', async () => {
    getApplications.mockRejectedValue(new ApiClientError(401));
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchAppByCode('app')).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('drops an off-origin x-current-path in fetchCurrentUser (no callbackUrl)', async () => {
    getCurrentUser.mockRejectedValue(new ApiClientError(401));
    headerStore.set('x-current-path', 'https://evil.com/steal');
    await expect(fetchCurrentUser()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});

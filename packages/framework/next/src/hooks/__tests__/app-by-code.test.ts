import { describe, it, expect, vi, beforeEach } from 'vitest';

const getApplications = vi.fn();
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  ApiClientError: class extends Error {
    status = 0;
  },
  AccessManagementClient: { create: () => ({ applications: { getApplications } }) },
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }) }));
vi.mock('react', async (i) => ({ ...(await i<typeof import('react')>()), cache: <T>(f: T) => f }));
vi.mock('@igrp/framework-next-auth/sanitize', () => ({ sanitizeRedirectUrl: () => '' }));
// Return the DTOs as-is so we assert the exact-match selection, not the mapping.
vi.mock('../../mappers/applications-mapper', () => ({
  mapperApplications: (r: { data: unknown[] }) => r.data,
}));

const { fetchAppByCode } = await import('../use-applications.js');
const { igrpSetAccessClientConfig, igrpResetAccessClientConfig } =
  await import('../../lib/api-config.js');

// `igrpSetAccessClientConfig` uses `AsyncLocalStorage.enterWith`, which does NOT
// propagate from a `beforeEach` hook into the test body — vitest runs them as
// separate async resources. Seeding in `beforeEach` therefore left the store
// empty for every `it`, and the mocked `AccessManagementClient.create` ignores
// its arguments, so nothing noticed until `igrpGetAccessClient`'s
// "not configured" guard started running on these paths. Seed inside the test.
const AM_CONFIG = { token: 'T', baseUrl: 'http://am' };

describe('fetchAppByCode selects the exact code match', () => {
  beforeEach(() => {
    igrpResetAccessClientConfig();
  });
  it('returns the app whose code equals the request, not list[0]', async () => {
    igrpSetAccessClientConfig(AM_CONFIG);
    getApplications.mockResolvedValueOnce({ data: [{ code: 'other' }, { code: 'app' }] });
    const result = await fetchAppByCode('app');
    expect(result).toEqual({ code: 'app' });
  });
});

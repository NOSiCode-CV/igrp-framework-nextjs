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

const { fetchAppByCode } = await import('../use-applications');
const { igrpSetAccessClientConfig, igrpResetAccessClientConfig } =
  await import('../../lib/api-config');

describe('fetchAppByCode selects the exact code match', () => {
  beforeEach(() => {
    igrpResetAccessClientConfig();
    igrpSetAccessClientConfig({ token: 'T', baseUrl: 'http://am' });
  });
  it('returns the app whose code equals the request, not list[0]', async () => {
    getApplications.mockResolvedValueOnce({ data: [{ code: 'other' }, { code: 'app' }] });
    const result = await fetchAppByCode('app');
    expect(result).toEqual({ code: 'app' });
  });
});

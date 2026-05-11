import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react cache so it works outside Next.js.
// Must actually memoize (like the real React.cache) so api-config's singleton
// config object is shared between igrpSetAccessClientConfig and igrpGetAccessClientConfig.
vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => {
    let result: ReturnType<T> | undefined;
    let called = false;
    return ((...args: Parameters<T>) => {
      if (!called) {
        result = fn(...args) as ReturnType<T>;
        called = true;
      }
      return result;
    }) as T;
  },
}));

// Mock AccessManagementClient so tests don't hit the network
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  AccessManagementClient: {
    create: vi.fn().mockReturnValue({}),
  },
}));

describe('igrpGetAccessClient', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('throws a clear error when baseUrl is empty', async () => {
    const { igrpGetAccessClient } = await import('../api-client');
    // baseUrl defaults to '' — no igrpSetAccessClientConfig call
    await expect(igrpGetAccessClient()).rejects.toThrow(
      'igrpGetAccessClient: baseUrl is not configured. Call igrpSetAccessClientConfig() before making API requests.',
    );
  });

  it('returns a client when baseUrl is set', async () => {
    const { igrpGetAccessClient } = await import('../api-client');
    const { igrpSetAccessClientConfig } = await import('../api-config');
    igrpSetAccessClientConfig({ baseUrl: 'https://api.example.com', token: 'tok' });
    const client = await igrpGetAccessClient();
    expect(client).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AccessManagementClient so tests don't hit the network
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  AccessManagementClient: {
    create: vi.fn().mockReturnValue({}),
  },
}));

// React.cache uses request scope in RSC renders. In tests (no request scope)
// we mock it as a zero-arg memoize so set-then-read works within a test.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T): T => {
      const result = fn();
      return (() => result) as T;
    },
  };
});

// Dynamic imports AFTER vi.mock so both mocks are in place when modules initialise.
const { igrpGetAccessClient } = await import('../api-client');
const { igrpSetAccessClientConfig, igrpResetAccessClientConfig } = await import('../api-config');

describe('igrpGetAccessClient', () => {
  beforeEach(() => {
    igrpResetAccessClientConfig();
  });

  it('throws a clear error when baseUrl is empty', async () => {
    // baseUrl defaults to '' — no igrpSetAccessClientConfig call
    await expect(igrpGetAccessClient()).rejects.toThrow(
      'igrpGetAccessClient: baseUrl is not configured. Call igrpSetAccessClientConfig() before making API requests.',
    );
  });

  it('returns a client when baseUrl is set', async () => {
    igrpSetAccessClientConfig({ baseUrl: 'https://api.example.com', token: 'tok' });
    const client = await igrpGetAccessClient();
    expect(client).toBeDefined();
  });
});

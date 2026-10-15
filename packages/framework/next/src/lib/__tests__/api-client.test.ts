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
const { igrpGetAccessClient } = await import('../api-client.js');
const { igrpSetAccessClientConfig, igrpResetAccessClientConfig } = await import('../api-config.js');
const { AccessManagementClient } = await import('@igrp/platform-access-management-client-ts');

describe('igrpGetAccessClient', () => {
  beforeEach(() => {
    igrpResetAccessClientConfig();
    vi.mocked(AccessManagementClient.create).mockClear();
  });

  it('throws a clear error when baseUrl is empty', () => {
    // baseUrl defaults to '' — no igrpSetAccessClientConfig call
    expect(() => igrpGetAccessClient()).toThrow(
      'Access Management client is not configured. Call igrpSetAccessClientConfig() first.',
    );
  });

  it('returns a client when baseUrl is set', () => {
    igrpSetAccessClientConfig({ baseUrl: 'https://api.example.com', token: 'tok' });
    const client = igrpGetAccessClient();
    expect(client).toBeDefined();
    expect(AccessManagementClient.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'https://api.example.com' }),
    );
  });

  it('warns once when an app calls the session traps, and still calls through', async () => {
    const rotateSession = vi.fn().mockResolvedValue('rotated');
    const closeSession = vi.fn().mockResolvedValue(undefined);
    const getCurrentSession = vi.fn().mockResolvedValue('current');
    vi.mocked(AccessManagementClient.create).mockReturnValue({
      sessions: { rotateSession, closeSession, getCurrentSession },
    } as never);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    igrpSetAccessClientConfig({ baseUrl: 'https://api.example.com', token: 'tok' });

    const client = igrpGetAccessClient();
    expect(await client.sessions.rotateSession({} as never)).toBe('rotated');
    await client.sessions.rotateSession({} as never);
    await client.sessions.closeSession();
    expect(await client.sessions.getCurrentSession()).toBe('current');

    expect(rotateSession).toHaveBeenCalledTimes(2);
    expect(closeSession).toHaveBeenCalledTimes(1);
    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.filter((m) => m.includes('rotateSession'))).toHaveLength(1);
    expect(messages.filter((m) => m.includes('closeSession'))).toHaveLength(1);
    expect(messages.some((m) => m.includes('getCurrentSession'))).toBe(false);
    warn.mockRestore();
    vi.mocked(AccessManagementClient.create).mockReturnValue({} as never);
  });

  it('throws when baseUrl is set but token is empty', async () => {
    igrpSetAccessClientConfig({ token: '', baseUrl: 'http://am' });
    expect(() => igrpGetAccessClient()).toThrow(/not configured/i);
  });
});

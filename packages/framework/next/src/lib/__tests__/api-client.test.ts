import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AccessManagementClient so tests don't hit the network
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  AccessManagementClient: {
    create: vi.fn().mockReturnValue({}),
  },
}));

// Static imports — api-config now uses a module-level mutable object, not React.cache,
// so there is no need for vi.resetModules() + dynamic import() to get a fresh instance.
import { igrpGetAccessClient } from '../api-client';
import { igrpSetAccessClientConfig, igrpResetAccessClientConfig } from '../api-config';

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

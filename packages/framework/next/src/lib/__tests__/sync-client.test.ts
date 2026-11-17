import { describe, expect, it, vi } from 'vitest';

const { create } = vi.hoisted(() => ({
  create: vi.fn((config: unknown, m2m: unknown) => ({ config, m2m })),
}));
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  AccessManagementClient: { create },
}));

const { igrpGetAccessManagementClient } = await import('../sync-client.js');

// The client cache is module-level, so every case uses its own baseUrl.
const creds = (clientId: string) => ({ serviceId: 'svc', clientId, clientSecret: 'secret' });

describe('igrpGetAccessManagementClient', () => {
  it('creates a client with the API config and exactly the M2M credentials', () => {
    const config = { baseUrl: 'http://am-1' };
    const client = igrpGetAccessManagementClient(config, {
      ...creds('c1'),
      extra: 'ignored',
    } as never);

    expect(create).toHaveBeenLastCalledWith(config, {
      serviceId: 'svc',
      clientId: 'c1',
      clientSecret: 'secret',
    });
    expect(client).toBe(create.mock.results.at(-1)!.value);
  });

  it('reuses the client for the same (baseUrl, clientId)', () => {
    const before = create.mock.calls.length;
    const a = igrpGetAccessManagementClient({ baseUrl: 'http://am-2' }, creds('c1'));
    const b = igrpGetAccessManagementClient({ baseUrl: 'http://am-2' }, creds('c1'));

    expect(a).toBe(b);
    expect(create.mock.calls.length - before).toBe(1);
  });

  it.each([
    ['a different baseUrl', 'http://am-3b', 'c1'],
    ['a different clientId', 'http://am-3', 'c2'],
  ])('creates a separate client for %s', (_, baseUrl, clientId) => {
    const a = igrpGetAccessManagementClient({ baseUrl: 'http://am-3' }, creds('c1'));
    const b = igrpGetAccessManagementClient({ baseUrl }, creds(clientId));

    expect(a).not.toBe(b);
  });

  it('propagates a failure from client creation and does not cache it', () => {
    create.mockImplementationOnce(() => {
      throw new Error('bad config');
    });

    expect(() => igrpGetAccessManagementClient({ baseUrl: 'http://am-4' }, creds('c1'))).toThrow(
      'bad config',
    );
    expect(igrpGetAccessManagementClient({ baseUrl: 'http://am-4' }, creds('c1'))).toBeDefined();
  });
});

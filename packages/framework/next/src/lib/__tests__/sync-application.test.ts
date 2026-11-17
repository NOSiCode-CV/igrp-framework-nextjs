import { beforeEach, describe, expect, it, vi } from 'vitest';

import { igrpSyncApplication } from '../sync-application.js';

const makeClient = () => ({ m2m: { syncApplications: vi.fn().mockResolvedValue(undefined) } });

const pkg = (overrides: Record<string, unknown> = {}) =>
  ({ name: 'demo-app', slug: 'demo', ...overrides }) as never;

const run = (client: ReturnType<typeof makeClient>, overrides?: Record<string, unknown>) =>
  igrpSyncApplication({
    client: client as never,
    appCode: 'APP_X',
    appInformation: pkg(overrides),
  });

describe('igrpSyncApplication', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('pushes an ACTIVE INTERNAL application built from package.json and logs success', async () => {
    const client = makeClient();

    await run(client, { displayName: 'Demo', description: 'Uma app' });

    expect(client.m2m.syncApplications).toHaveBeenCalledWith({
      id: 0,
      code: 'APP_X',
      type: 'INTERNAL',
      name: 'Demo',
      status: 'ACTIVE',
      description: 'Uma app',
      slug: 'demo',
      departments: [],
    });
    expect(console.info).toHaveBeenCalledWith(
      'Application',
      'APP_X',
      'metadata synced successfully.',
    );
  });

  it.each([
    ['displayName missing → name', {}, 'demo-app'],
    ['displayName null → name', { displayName: null }, 'demo-app'],
    ['displayName empty string is kept', { displayName: '' }, ''],
  ])('%s', async (_, overrides, expectedName) => {
    const client = makeClient();

    await run(client, overrides);

    expect(client.m2m.syncApplications).toHaveBeenCalledWith(
      expect.objectContaining({ name: expectedName }),
    );
  });

  it.each([
    ['missing', {}],
    ['null', { description: null }],
  ])('defaults a %s description to an empty string', async (_, overrides) => {
    const client = makeClient();

    await run(client, overrides);

    expect(client.m2m.syncApplications).toHaveBeenCalledWith(
      expect.objectContaining({ description: '' }),
    );
  });

  it('accepts an empty response body from the server', async () => {
    const client = makeClient();
    client.m2m.syncApplications.mockResolvedValueOnce({ data: null, status: 204, statusText: '' });

    await expect(run(client)).resolves.toBeUndefined();
  });

  it.each([
    ['an HTTP error', Object.assign(new Error('status 500'), { status: 500 })],
    ['a network failure', new TypeError('fetch failed')],
  ])('propagates %s and does not log success', async (_, error) => {
    const client = makeClient();
    client.m2m.syncApplications.mockRejectedValueOnce(error);

    await expect(run(client)).rejects.toBe(error);
    expect(console.info).not.toHaveBeenCalled();
  });
});

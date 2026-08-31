import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

import { igrpSyncPermissions } from '../sync-permissions';

const makeClient = () => ({
  m2m: {
    syncPermissions: vi.fn().mockResolvedValue(undefined),
  },
});

const CATALOG = [
  { name: 'manage_access', description: 'Gerir acessos', enabled: true },
  { name: 'delete_invoice', description: 'Eliminar faturas', enabled: false },
];

describe('igrpSyncPermissions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('skips the push and logs when syncEnabled=false', async () => {
    const client = makeClient();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await igrpSyncPermissions({ client: client as any, permissions: CATALOG, syncEnabled: false });

    expect(client.m2m.syncPermissions).not.toHaveBeenCalled();
    expect(info.mock.calls[0]?.[0]).toContain('IGRP_SYNC_PERMISSIONS=false');
  });

  it('skips an empty catalog rather than sending an empty upsert', async () => {
    const client = makeClient();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await igrpSyncPermissions({ client: client as any, permissions: [], syncEnabled: true });

    expect(client.m2m.syncPermissions).not.toHaveBeenCalled();
    expect(info.mock.calls[0]?.[0]).toContain('no permissions declared');
  });

  it('maps enabled → ACTIVE / INACTIVE and empties departmentCode', async () => {
    const client = makeClient();
    vi.spyOn(console, 'info').mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await igrpSyncPermissions({ client: client as any, permissions: CATALOG, syncEnabled: true });

    expect(client.m2m.syncPermissions).toHaveBeenCalledTimes(1);
    const sent = client.m2m.syncPermissions.mock.calls[0]?.[0] ?? [];
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({
      name: 'manage_access',
      description: 'Gerir acessos',
      status: 'ACTIVE',
      departmentCode: '',
    });
    expect(sent[1]).toMatchObject({ name: 'delete_invoice', status: 'INACTIVE' });
  });

  it('omits `id` from the wire payload entirely — never sends id: 0', async () => {
    const client = makeClient();
    vi.spyOn(console, 'info').mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await igrpSyncPermissions({ client: client as any, permissions: CATALOG, syncEnabled: true });

    const sent = client.m2m.syncPermissions.mock.calls[0]?.[0] ?? [];
    // `id: undefined` must not survive serialization — a literal `"id":0` could
    // be read by the backend as "update row 0" instead of an upsert by name.
    const wire = JSON.parse(JSON.stringify(sent));
    expect('id' in wire[0]).toBe(false);
    expect(JSON.stringify(sent)).not.toContain('"id"');
  });

  it('maps a missing description to null (not undefined)', async () => {
    const client = makeClient();
    vi.spyOn(console, 'info').mockImplementation(() => {});

    await igrpSyncPermissions({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      permissions: [{ name: 'no_description', enabled: true }],
      syncEnabled: true,
    });

    expect(client.m2m.syncPermissions.mock.calls[0]?.[0]?.[0]?.description).toBeNull();
  });
});

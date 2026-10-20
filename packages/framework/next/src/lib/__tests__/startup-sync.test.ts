import { describe, it, expect, vi, beforeEach } from 'vitest';

const syncApplication = vi.fn();
vi.mock('../sync-application.js', () => ({ igrpSyncApplication: syncApplication }));
vi.mock('../sync-menus.js', () => ({ igrpSyncMenus: vi.fn() }));
vi.mock('../sync-permissions.js', () => ({ igrpSyncPermissions: vi.fn() }));
vi.mock('../sync-routes.js', () => ({ igrpSyncRoutes: vi.fn() }));

const { igrpStartupSync, igrpResetStartupSync } = await import('../startup-sync.js');

const plan = {
  client: {} as never,
  appCode: 'APP',
  serviceId: 'svc',
  appInformation: { name: 'app' },
  menus: [],
  syncOnCodeMenus: false,
  syncOnCodeMenuRoles: true,
  permissions: [],
  syncPermissions: false,
};

beforeEach(() => {
  igrpResetStartupSync();
  syncApplication.mockReset().mockResolvedValue(undefined);
  vi.restoreAllMocks();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('igrpStartupSync', () => {
  it('runs once per process on success', async () => {
    await igrpStartupSync(plan);
    await igrpStartupSync(plan);
    expect(syncApplication).toHaveBeenCalledTimes(1);
  });

  // `IGRPRootLayout` schedules this via after() on EVERY request. Resetting the
  // mutex on failure with no cooldown meant a down AM server got a full sync
  // attempt per request — a retry storm that also buried the first useful error.
  it('does not retry on the very next request after a failure', async () => {
    syncApplication.mockRejectedValueOnce(new Error('AM down'));
    await igrpStartupSync(plan);
    await igrpStartupSync(plan);
    expect(syncApplication).toHaveBeenCalledTimes(1);
  });

  it('retries once the cooldown has elapsed', async () => {
    syncApplication.mockRejectedValueOnce(new Error('AM down'));
    await igrpStartupSync(plan);

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    await igrpStartupSync(plan);
    expect(syncApplication).toHaveBeenCalledTimes(2);
  });

  it('reports the cooldown in the structured failure log', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    syncApplication.mockRejectedValueOnce(new Error('AM down'));
    await igrpStartupSync(plan);
    expect(JSON.parse(error.mock.calls[0]![0] as string)).toMatchObject({
      event: 'igrp.am.sync_failed',
      retryAfterMs: 60_000,
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

import { igrpSyncMenus } from '../sync-menus';

const makeClient = () => ({
  m2m: {
    syncApplicationMenus: vi.fn().mockResolvedValue(undefined),
  },
});

describe('igrpSyncMenus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('skips the push and logs an info message when syncEnabled=false', async () => {
    const client = makeClient();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await igrpSyncMenus({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      appCode: 'APP_TEST_1',
      menus: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { id: 1, code: 'M1', name: 'M1', type: 'MENU_PAGE', status: 'ACTIVE' } as any,
      ],
      syncEnabled: false,
    });

    expect(client.m2m.syncApplicationMenus).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'On-code menus sync skipped (IGRP_SYNC_ON_CODE_MENUS=false).',
    );
  });

  it('calls syncApplicationMenus with mapped menus when syncEnabled=true', async () => {
    const client = makeClient();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    const menus = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 1, code: 'M1', name: 'M1', type: 'MENU_PAGE', status: 'ACTIVE' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 2, code: 'M2', name: 'M2', type: 'FOLDER', status: 'ACTIVE' } as any,
    ];

    await igrpSyncMenus({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      appCode: 'APP_TEST_1',
      menus,
      syncEnabled: true,
    });

    expect(client.m2m.syncApplicationMenus).toHaveBeenCalledTimes(1);
    expect(client.m2m.syncApplicationMenus).toHaveBeenCalledWith(
      'APP_TEST_1',
      expect.arrayContaining([
        expect.objectContaining({ code: 'M1', type: 'MENU_PAGE', status: 'ACTIVE' }),
        expect.objectContaining({ code: 'M2', type: 'FOLDER', status: 'ACTIVE' }),
      ]),
    );
    expect(info).toHaveBeenCalledWith('On-code menus synchronized successfully.');
  });
});

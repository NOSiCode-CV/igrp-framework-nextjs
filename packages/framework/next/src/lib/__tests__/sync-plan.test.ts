import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('../sync-client', () => ({
  igrpGetAccessManagementClient: vi.fn(() => ({
    m2m: { syncApplicationMenus: vi.fn() },
  })),
}));

import { planAccessManagementSync, type IGRPPlanAccessManagementSyncArgs } from '../sync-plan';
import { IgrpConfigError } from '../../errors';

const makeArgs = (
  overrides: Partial<IGRPPlanAccessManagementSyncArgs> = {},
): IGRPPlanAccessManagementSyncArgs => ({
  syncAccess: true,
  previewMode: false,
  appCode: 'APP_TEST_1',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appInformation: { name: 'test', version: '0.0.0' } as any,
  menus: [],
  apiManagementConfig: {
    baseUrl: 'https://am.example.com',
    serviceId: 'test-service',
    m2mClientId: 'cid',
    m2mClientSecret: 'csecret',
  },
  ...overrides,
});

describe('planAccessManagementSync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('passes args.menus through verbatim into the plan', () => {
    const menus = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 1, code: 'A', name: 'A', type: 'MENU_PAGE', status: 'ACTIVE' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 2, code: 'B', name: 'B', type: 'FOLDER', status: 'ACTIVE' } as any,
    ];

    const plan = planAccessManagementSync(makeArgs({ menus }));

    expect(plan).not.toBeNull();
    expect(plan!.menus).toBe(menus);
  });

  it('narrows syncOnCodeMenus to false when the field is omitted', () => {
    const plan = planAccessManagementSync(
      makeArgs({
        apiManagementConfig: {
          baseUrl: 'https://am.example.com',
          serviceId: 'test-service',
          m2mClientId: 'cid',
          m2mClientSecret: 'csecret',
          // syncOnCodeMenus intentionally omitted
        },
      }),
    );

    expect(plan).not.toBeNull();
    expect(plan!.syncOnCodeMenus).toBe(false);
  });

  it('sets syncOnCodeMenus to true when explicitly true', () => {
    const plan = planAccessManagementSync(
      makeArgs({
        apiManagementConfig: {
          baseUrl: 'https://am.example.com',
          serviceId: 'test-service',
          m2mClientId: 'cid',
          m2mClientSecret: 'csecret',
          syncOnCodeMenus: true,
        },
      }),
    );

    expect(plan).not.toBeNull();
    expect(plan!.syncOnCodeMenus).toBe(true);
  });

  it('returns null in preview mode even with all other gates positive', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const plan = planAccessManagementSync(
      makeArgs({
        previewMode: true,
        syncAccess: true,
        apiManagementConfig: {
          baseUrl: 'https://am.example.com',
          serviceId: 'test-service',
          m2mClientId: 'cid',
          m2mClientSecret: 'csecret',
          syncOnCodeMenus: true,
        },
      }),
    );

    expect(plan).toBeNull();
  });

  it('returns null when syncAccess is false', () => {
    const plan = planAccessManagementSync(makeArgs({ syncAccess: false }));
    expect(plan).toBeNull();
  });

  it('throws IgrpConfigError with IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING when baseUrl is missing', () => {
    expect(() =>
      planAccessManagementSync(
        makeArgs({
          apiManagementConfig: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            baseUrl: '' as any,
            serviceId: 'test-service',
            m2mClientId: 'cid',
            m2mClientSecret: 'csecret',
          },
        }),
      ),
    ).toThrow(IgrpConfigError);

    try {
      planAccessManagementSync(
        makeArgs({
          apiManagementConfig: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            baseUrl: '' as any,
            serviceId: 'test-service',
            m2mClientId: 'cid',
            m2mClientSecret: 'csecret',
          },
        }),
      );
    } catch (err) {
      expect(err).toBeInstanceOf(IgrpConfigError);
      expect((err as IgrpConfigError).code).toBe('IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING');
    }
  });
});

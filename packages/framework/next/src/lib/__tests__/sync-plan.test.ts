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

  it('defaults syncOnCodeMenuRoles to true when the field is omitted', () => {
    const plan = planAccessManagementSync(
      makeArgs({
        apiManagementConfig: {
          baseUrl: 'https://am.example.com',
          serviceId: 'test-service',
          m2mClientId: 'cid',
          m2mClientSecret: 'csecret',
          // syncOnCodeMenuRoles intentionally omitted
        },
      }),
    );

    expect(plan).not.toBeNull();
    expect(plan!.syncOnCodeMenuRoles).toBe(true);
  });

  it('sets syncOnCodeMenuRoles to false only when explicitly false', () => {
    const plan = planAccessManagementSync(
      makeArgs({
        apiManagementConfig: {
          baseUrl: 'https://am.example.com',
          serviceId: 'test-service',
          m2mClientId: 'cid',
          m2mClientSecret: 'csecret',
          syncOnCodeMenuRoles: false,
        },
      }),
    );

    expect(plan).not.toBeNull();
    expect(plan!.syncOnCodeMenuRoles).toBe(false);
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

  it('accepts a lowercase app code and normalizes it to uppercase (FN-1)', () => {
    const plan = planAccessManagementSync(makeArgs({ appCode: 'app_test_1' }));

    expect(plan).not.toBeNull();
    expect(plan!.appCode).toBe('APP_TEST_1');
  });

  it('accepts a mixed-case app code and normalizes it to uppercase (FN-1)', () => {
    const plan = planAccessManagementSync(makeArgs({ appCode: 'App_Test_1' }));

    expect(plan).not.toBeNull();
    expect(plan!.appCode).toBe('APP_TEST_1');
  });

  it('still rejects app codes with invalid characters after normalization (FN-1)', () => {
    expect(() => planAccessManagementSync(makeArgs({ appCode: 'app code!' }))).toThrow(
      IgrpConfigError,
    );
  });

  it('still rejects app codes with dashes (underscores only) (FN-1)', () => {
    expect(() => planAccessManagementSync(makeArgs({ appCode: 'app-test' }))).toThrow(
      IgrpConfigError,
    );
  });
});

describe('planAccessManagementSync — permission catalog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to an empty catalog and syncPermissions=false when omitted', () => {
    const plan = planAccessManagementSync(makeArgs());
    expect(plan?.permissions).toEqual([]);
    expect(plan?.syncPermissions).toBe(false);
  });

  it('reads syncPermissions from apiManagementConfig', () => {
    const plan = planAccessManagementSync(
      makeArgs({
        apiManagementConfig: {
          baseUrl: 'https://am.example.com',
          serviceId: 'test-service',
          m2mClientId: 'cid',
          m2mClientSecret: 'csecret',
          syncPermissions: true,
        },
      }),
    );
    expect(plan?.syncPermissions).toBe(true);
  });

  it('keeps valid names and DROPS malformed ones with a warning (never throws)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const plan = planAccessManagementSync(
      makeArgs({
        permissions: [
          { name: 'manage_access', enabled: true },
          { name: 'has space', enabled: true },
          { name: 'has/slash', enabled: true },
          { name: '', enabled: true },
          { name: 'a'.repeat(256), enabled: true },
          { name: 'valid.dotted-name_2', enabled: true },
        ],
      }),
    );

    expect(plan?.permissions.map((p) => p.name)).toEqual(['manage_access', 'valid.dotted-name_2']);
    const messages = warn.mock.calls.map((c) => String(c[0])).join('\n');
    expect(messages).toContain('4 permission(s) skipped');
    expect(messages).toContain('has space');
  });

  it('warns that a dotted name breaks bare-name igrpAuthorize (dev only)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    planAccessManagementSync(
      makeArgs({ permissions: [{ name: 'DEPT.invoice.delete', enabled: true }] }),
    );

    const messages = warn.mock.calls.map((c) => String(c[0])).join('\n');
    expect(messages).toContain('contain a dot');
    expect(messages).toContain('DEPT.invoice.delete');
  });

  it('stays silent about dotted names in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');

    planAccessManagementSync(
      makeArgs({ permissions: [{ name: 'DEPT.invoice.delete', enabled: true }] }),
    );

    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).not.toContain('contain a dot');
    vi.unstubAllEnvs();
  });
});

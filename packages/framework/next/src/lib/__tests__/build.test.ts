import { describe, it, expect } from 'vitest';

import { igrpBuildConfig } from '../build.js';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

// Loose builder — runtime configs are looser than the declared type
// (env vars can be undefined), which is exactly what the schema guards.
const baseConfig = (overrides: Record<string, unknown> = {}): IGRPConfigArgs =>
  ({
    appCode: 'APP_TEST',
    previewMode: true,
    syncAccess: false,
    appInformation: { name: 'test', version: '0.0.0' },
    layoutMockData: {
      getHeaderData: async () => ({}),
      getSidebarData: async () => ({}),
    },
    layout: { session: null },
    toasterConfig: { showToaster: false },
    ...overrides,
  }) as unknown as IGRPConfigArgs;

describe('igrpBuildConfig validation (FN-2)', () => {
  it('throws IGRP_CONFIG_NOT_INITIALIZED for null/undefined config', async () => {
    await expect(igrpBuildConfig(null as unknown as IGRPConfigArgs)).rejects.toMatchObject({
      code: 'IGRP_CONFIG_NOT_INITIALIZED',
    });
  });

  it('accepts a minimal preview-mode config and returns it unchanged', async () => {
    const cfg = baseConfig();
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });

  it('accepts a non-preview, sync-off config with only a baseUrl (no m2m credentials)', async () => {
    const cfg = baseConfig({
      previewMode: false,
      syncAccess: false,
      apiManagementConfig: { baseUrl: 'https://am.example.com' },
    });
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });

  it('throws IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING when preview is off and baseUrl is absent', async () => {
    const cfg = baseConfig({ previewMode: false });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({
      code: 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
    });
  });

  it('throws IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING when sync is on but m2m credentials are missing', async () => {
    const cfg = baseConfig({
      previewMode: false,
      syncAccess: true,
      apiManagementConfig: { baseUrl: 'https://am.example.com', serviceId: 'svc' },
      // m2mClientId / m2mClientSecret intentionally absent
    });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({
      code: 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING',
      context: expect.objectContaining({ field: expect.stringContaining('m2mClientId') }),
    });
  });

  it('throws IGRP_APP_CODE_MISSING when sync is on but appCode is blank', async () => {
    const cfg = baseConfig({
      appCode: '   ',
      previewMode: false,
      syncAccess: true,
      apiManagementConfig: {
        baseUrl: 'https://am.example.com',
        serviceId: 'svc',
        m2mClientId: 'cid',
        m2mClientSecret: 'cs',
      },
    });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_APP_CODE_MISSING' });
  });

  it('throws IGRP_CONFIG_INVALID when layoutMockData getters are not functions', async () => {
    const cfg = baseConfig({
      layoutMockData: { getHeaderData: 'nope', getSidebarData: async () => ({}) },
    });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_CONFIG_INVALID' });
  });

  it('throws IGRP_CONFIG_INVALID when previewMode is not a boolean', async () => {
    const cfg = baseConfig({ previewMode: undefined });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_CONFIG_INVALID' });
  });

  it('sync-on preview mode does NOT require m2m credentials (preview wins)', async () => {
    const cfg = baseConfig({ previewMode: true, syncAccess: true });
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });
});

describe('igrpBuildConfig appCode canonicalization', () => {
  it('normalizes a lowercase appCode to uppercase in the returned config', async () => {
    const cfg = baseConfig({ appCode: 'app_test' });

    const result = await igrpBuildConfig(cfg);

    expect(result.appCode).toBe('APP_TEST');
    // Shallow copy: only appCode changes, every other field keeps its identity
    expect(result).not.toBe(cfg);
    expect(result.layoutMockData).toBe(cfg.layoutMockData);
    expect(result.toasterConfig).toBe(cfg.toasterConfig);
    // The input config is not mutated
    expect(cfg.appCode).toBe('app_test');
  });

  it('trims surrounding whitespace while normalizing', async () => {
    const cfg = baseConfig({ appCode: '  App_Test  ' });

    const result = await igrpBuildConfig(cfg);

    expect(result.appCode).toBe('APP_TEST');
  });

  it('returns the original object untouched when appCode is already canonical', async () => {
    const cfg = baseConfig(); // appCode: 'APP_TEST'
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });

  it('leaves a missing appCode alone (preview mode boots without one)', async () => {
    const cfg = baseConfig({ appCode: undefined });
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });
});

/**
 * `appInformation` and `layout` are required by `IGRPConfigArgs` but were not
 * in the schema, so the validator that exists to route config errors to
 * `global-error.tsx` let both through:
 *
 *  • a missing `layout` is a bare `TypeError` on the first line of
 *    `IGRPRootLayout`'s render, with no framework code attached;
 *  • a missing `appInformation.name` surfaces inside `igrpSyncApplication`,
 *    which runs in `after()` — post-stream, where nothing but a server log
 *    ever sees it. That is the exact blind spot the synchronous validation
 *    was built to avoid.
 */
describe('igrpBuildConfig validates the rest of the required contract', () => {
  it('rejects a config with no layout', async () => {
    const cfg = baseConfig();
    delete (cfg as Record<string, unknown>).layout;
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_CONFIG_INVALID' });
  });

  it('rejects a blank appInformation.name when sync is on', async () => {
    const cfg = baseConfig({
      previewMode: false,
      syncAccess: true,
      appInformation: { name: '   ' },
      apiManagementConfig: {
        baseUrl: 'https://am.example.com',
        serviceId: 'svc',
        m2mClientId: 'id',
        m2mClientSecret: 'secret',
      },
    });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_CONFIG_INVALID' });
  });

  it('does not require appInformation.name when sync is off', async () => {
    const cfg = baseConfig({ appInformation: {} });
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });
});

/**
 * `layoutMockData` is production configuration wearing a preview-mode name —
 * both providers call it on every render in both modes and keep most of what it
 * returns. `layoutData` is the honest name; the old one stays readable for one
 * release, and setting both is a conflict rather than a merge.
 */
describe('layoutData supersedes layoutMockData', () => {
  it('accepts the new name on its own', async () => {
    const cfg = baseConfig({
      layoutData: { getHeaderData: async () => ({}), getSidebarData: async () => ({}) },
      layoutMockData: undefined,
    });
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });

  it('still accepts the deprecated name on its own', async () => {
    const cfg = baseConfig();
    await expect(igrpBuildConfig(cfg)).resolves.toBe(cfg);
  });

  it('rejects a config that sets neither', async () => {
    const cfg = baseConfig({ layoutMockData: undefined });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_CONFIG_INVALID' });
  });

  it('rejects a config that sets both', async () => {
    const cfg = baseConfig({
      layoutData: { getHeaderData: async () => ({}), getSidebarData: async () => ({}) },
    });
    await expect(igrpBuildConfig(cfg)).rejects.toMatchObject({ code: 'IGRP_CONFIG_INVALID' });
  });
});

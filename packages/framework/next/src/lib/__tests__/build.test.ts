import { describe, it, expect } from 'vitest';

import { igrpBuildConfig } from '../build';
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

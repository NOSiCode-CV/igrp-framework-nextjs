import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const after = vi.fn();
vi.mock('next/server', () => ({ after }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('../../branding/request.js', () => ({ igrpResolveRequestBranding: async () => null }));
let syncDone = false;
vi.mock('../../lib/startup-sync.js', () => ({
  igrpStartupSync: vi.fn(),
  igrpStartupSyncDone: () => syncDone,
}));
const plan = vi.fn(() => ({ appCode: 'APP' }));
vi.mock('../../lib/sync-plan.js', () => ({
  planAccessManagementSync: plan,
  APP_CODE_PATTERN: /^[A-Z0-9][A-Z0-9_]{0,62}[A-Z0-9]$/,
}));
vi.mock('@igrp/framework-next-ui', () => ({
  IGRPNestedProviders: (p: unknown) => p,
  IGRPBrandingStyle: (p: unknown) => p,
  IGRP_CHROME_STRINGS_PT: {},
  IGRP_CHROME_STRINGS_EN: {},
  IGRP_CHROME_STRINGS_FR: {},
}));

const { IGRPRootLayout } = await import('../igrp-root-layout.js');

const config = {
  font: '',
  layout: { session: null, activeThemeValue: 'blue', isScaled: false },
  sessionArgs: {},
  syncAccess: true,
  previewMode: false,
  appInformation: { name: 'app' },
  apiManagementConfig: { baseUrl: 'https://am.example' },
  appCode: 'APP',
} as never;

beforeEach(() => {
  syncDone = false;
  plan.mockClear();
  after.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe('IGRPRootLayout Access Management sync plan', () => {
  it('validates and schedules the sync until one has completed', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await IGRPRootLayout({ children: null, config });
    expect(plan).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('skips the plan in production once a sync has completed', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    syncDone = true;
    await IGRPRootLayout({ children: null, config });
    expect(plan).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it('keeps validating in development after a sync, without scheduling another', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    syncDone = true;
    await IGRPRootLayout({ children: null, config });
    expect(plan).toHaveBeenCalledTimes(1);
    expect(after).not.toHaveBeenCalled();
  });
});

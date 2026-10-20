import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveRequestBranding = vi.fn();
vi.mock('../../branding/request.js', () => ({
  igrpResolveRequestBranding: resolveRequestBranding,
}));
vi.mock('../../lib/sync-plan.js', () => ({ planAccessManagementSync: () => null }));
vi.mock('next/server', () => ({ after: () => {} }));
vi.mock('@igrp/framework-next-ui', () => ({
  IGRPNestedProviders: (p: unknown) => ({ __marker: 'providers', p }),
  IGRPBrandingStyle: (p: unknown) => ({ __marker: 'style', p }),
  // Read at import time by the i18n strings module the layout pulls in.
  IGRP_CHROME_STRINGS_PT: {},
  IGRP_CHROME_STRINGS_EN: {},
  IGRP_CHROME_STRINGS_FR: {},
}));

import { IGRPBrandingStyle, IGRPNestedProviders } from '@igrp/framework-next-ui';

const { IGRPRootLayout } = await import('../igrp-root-layout.js');

const config = (overrides: Record<string, unknown> = {}) =>
  ({
    font: '',
    layout: { session: null, activeThemeValue: 'blue', isScaled: false },
    sessionArgs: {},
    syncAccess: false,
    previewMode: false,
    appInformation: { name: 'app' },
    apiManagementConfig: { baseUrl: 'https://am.example' },
    appCode: 'APP',
    ...overrides,
  }) as never;

// The layout returns React elements: match a rendered component by its `type`.

function find(node: any, component: unknown): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = find(child, component);
      if (hit) return hit;
    }
    return null;
  }
  if (node.type === component) return node;
  return find(node.props?.children, component);
}

beforeEach(() => {
  resolveRequestBranding.mockReset().mockResolvedValue(null);
});

describe('IGRPRootLayout organization branding', () => {
  it('does not read the Brand when the flag is omitted', async () => {
    await IGRPRootLayout({ children: null, config: config() });
    expect(resolveRequestBranding).toHaveBeenCalledTimes(1);
    expect(resolveRequestBranding.mock.calls[0][0].branding).toBeUndefined();
  });

  it('calls the resolver once with the config when the flag is on', async () => {
    const cfg = config({ branding: { enabled: true } });
    await IGRPRootLayout({ children: null, config: cfg });
    expect(resolveRequestBranding).toHaveBeenCalledWith(cfg);
  });

  it('passes the resolved Brand to the style element and the providers', async () => {
    const brand = { version: 1, tokens: {}, logos: {} };
    resolveRequestBranding.mockResolvedValue(brand);
    const tree = await IGRPRootLayout({
      children: null,
      config: config({ branding: { enabled: true } }),
    });
    expect(find(tree, IGRPBrandingStyle)?.props.branding).toBe(brand);
    expect(find(tree, IGRPNestedProviders)?.props.branding).toBe(brand);
  });

  it('renders providers with null when the resolver returns null', async () => {
    const tree = await IGRPRootLayout({ children: null, config: config() });
    expect(find(tree, IGRPNestedProviders)?.props.branding ?? null).toBeNull();
  });

  it('no longer emits a preset theme class on the body', async () => {
    const tree = await IGRPRootLayout({ children: null, config: config() });
    const body = JSON.stringify(tree);
    expect(body).not.toContain('theme-blue');
  });
});

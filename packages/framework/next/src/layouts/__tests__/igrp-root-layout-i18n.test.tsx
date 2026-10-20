import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IGRPConfigArgs } from '@igrp/framework-next-types';

vi.mock('next/server', () => ({ after: vi.fn() }));
let cookieValue: string | undefined;
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'IGRP_LOCALE' && cookieValue ? { value: cookieValue } : undefined,
  }),
}));
const DsProvider = (p: unknown) => ({ __marker: 'ds', p });
vi.mock('@igrp/igrp-framework-react-design-system', () => ({ IGRPI18nProvider: DsProvider }));
const ChromeProvider = (p: unknown) => ({ __marker: 'chrome', p });
vi.mock('next-intl/server', () => ({
  getMessages: vi.fn(async () => ({ app: { hi: 'Salut' } })),
}));
vi.mock('../../lib/startup-sync.js', () => ({ igrpStartupSync: vi.fn() }));
vi.mock('../../lib/sync-plan.js', () => ({ planAccessManagementSync: () => null }));
const Nested = (p: unknown) => ({ __marker: 'nested', p });
vi.mock('@igrp/framework-next-ui', () => ({
  IGRPNestedProviders: Nested,
  IGRPChromeI18nProvider: ChromeProvider,
  IGRPBrandingStyle: () => null,
  igrpParseBranding: () => ({ branding: null, dropped: 0 }),
  IGRP_CHROME_STRINGS_PT: {},
  IGRP_CHROME_STRINGS_EN: {},
  IGRP_CHROME_STRINGS_FR: {},
}));
const Intl = (p: unknown) => ({ __marker: 'intl', p });
vi.mock('../../i18n/client/index.js', () => ({ IGRPIntlProvider: Intl }));
const resolveLocale = vi.fn(async () => 'fr');
vi.mock('../../i18n/server/resolve.js', () => ({ igrpResolveLocale: resolveLocale }));
vi.mock('../../i18n/server/strings.js', () => ({
  igrpGetDesignSystemStrings: () => ({ ds: true }),
  igrpGetChromeStrings: () => ({ chrome: true }),
  DS: { pt: { ds: 'pt' }, en: { ds: 'en' }, fr: { ds: 'fr' } },
  CHROME: { pt: { chrome: 'pt' }, en: { chrome: 'en' }, fr: { chrome: 'fr' } },
}));

const { IGRPRootLayout } = await import('../igrp-root-layout.js');
const { igrpDefineI18n } = await import('../../i18n/config.js');

function find(node: any, type: unknown): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) return node.map((n) => find(n, type)).find(Boolean) ?? null;
  if (node.type === type) return node;
  return node.props ? find(node.props.children ?? null, type) : null;
}

const base = () =>
  ({
    previewMode: true,
    syncAccess: false,
    appCode: 'X',
    appInformation: { name: 'x' },
    layout: { session: null },
    toasterConfig: { showToaster: false },
    layoutData: { getHeaderData: async () => ({}), getSidebarData: async () => ({}) },
  }) as unknown as IGRPConfigArgs;

beforeEach(() => {
  resolveLocale.mockClear();
  cookieValue = undefined;
});

describe('IGRPRootLayout i18n', () => {
  it('without config.i18n keeps lang="pt" and mounts no intl provider', async () => {
    const tree = await IGRPRootLayout({ config: base(), children: 'kids' });
    expect(tree.props.lang).toBe('pt');
    expect(find(tree, Intl)).toBeNull();
    expect(resolveLocale).not.toHaveBeenCalled();
  });

  it('without config.i18n follows the IGRP_LOCALE cookie for the DS and chrome catalogs', async () => {
    cookieValue = 'en';
    const tree = await IGRPRootLayout({ config: base(), children: 'kids' });
    expect(tree.props.lang).toBe('en-GB');
    const ds = find(tree, DsProvider);
    expect(ds.props).toMatchObject({ strings: { ds: 'en' }, locale: 'en-GB' });
    expect(find(ds, ChromeProvider).props).toMatchObject({
      strings: { chrome: 'en' },
      children: 'kids',
    });
    expect(find(tree, Intl)).toBeNull();
  });

  it('without config.i18n ignores an unsupported cookie value', async () => {
    cookieValue = 'de';
    const tree = await IGRPRootLayout({ config: base(), children: 'kids' });
    expect(tree.props.lang).toBe('pt');
    expect(find(tree, DsProvider)).toBeNull();
  });

  it('with config.i18n sets <html lang> to the format locale and mounts IGRPIntlProvider inside the nested providers', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', formatLocales: { fr: 'fr-CA' } });
    const tree = await IGRPRootLayout({ config: { ...base(), i18n }, children: 'kids' });
    expect(tree.props.lang).toBe('fr-CA');
    const nested = find(tree, Nested);
    const intl = find(nested, Intl);
    expect(intl.props).toMatchObject({
      locale: 'fr',
      formatLocale: 'fr-CA',
      locales: ['pt', 'en', 'fr'],
      messages: { app: { hi: 'Salut' } },
      designSystemStrings: { ds: true },
      chromeStrings: { chrome: true },
      children: 'kids',
    });
  });

  it('an explicit lang prop still wins', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt' });
    const tree = await IGRPRootLayout({
      config: { ...base(), i18n },
      children: null,
      lang: 'pt-PT',
    });
    expect(tree.props.lang).toBe('pt-PT');
  });
});

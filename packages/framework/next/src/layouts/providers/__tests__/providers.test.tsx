import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The header and sidebar providers had **no coverage at all** — every defect in
 * them (the preview-mode branch, the sidebar-trigger override, the dead
 * `showPreviewMode` write, the untransmitted `timeout`) was found by reading,
 * not by a failing test.
 *
 * They are async Server Components, i.e. async functions returning an element,
 * so they are called directly and their returned element's props asserted. That
 * needs no DOM and keeps the package's `environment: 'node'` setup.
 */

const Header = (p: unknown) => ({ __marker: 'header', p });
const Sidebar = (p: unknown) => ({ __marker: 'sidebar', p });
const HeaderData = (p: unknown) => ({ __marker: 'header-data', p });
const SidebarData = (p: unknown) => ({ __marker: 'sidebar-data', p });
vi.mock('@igrp/framework-next-ui', () => ({
  IGRPTemplateHeader: Header,
  IGRPTemplateSidebar: Sidebar,
  IGRPHeaderDataProvider: HeaderData,
  IGRPSidebarDataProvider: SidebarData,
  igrpMenusToPaletteCommands: (menus: { code: string }[]) =>
    menus.map((m) => ({ id: m.code, label: m.code, href: `/${m.code}` })),
}));

const fetchCurrentUser = vi.fn();
const fetchMenus = vi.fn();
const fetchAppsByUser = vi.fn();
vi.mock('../../../hooks/use-user.js', () => ({ fetchCurrentUser }));
vi.mock('../../../hooks/use-menus.js', () => ({ fetchMenus }));
vi.mock('../../../hooks/use-applications.js', () => ({ fetchAppsByUser }));

const setConfig = vi.fn();
vi.mock('../../../lib/api-config.js', () => ({ igrpSetAccessClientConfig: setConfig }));

/** Real `redirect()` semantics: throws, and `unstable_rethrow` must let it out. */
const REDIRECT = Object.assign(new Error('NEXT_REDIRECT'), {
  digest: 'NEXT_REDIRECT;replace;/login;307;',
});
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return { unstable_rethrow: actual.unstable_rethrow };
});

const { HeaderDataProvider } = await import('../header-data-provider.js');
const { SidebarDataProvider } = await import('../sidebar-data-provider.js');

const getHeaderData = vi.fn();
const getSidebarData = vi.fn();
const layoutData = { getHeaderData, getSidebarData };

const props = (el: any) => el.props;

beforeEach(() => {
  vi.clearAllMocks();
  getHeaderData.mockResolvedValue({ showIGRPSidebarTrigger: true, settingsUrl: '/s' });
  getSidebarData.mockResolvedValue({ showAppSwitcher: true, defaultOpen: false });
  fetchCurrentUser.mockResolvedValue({ id: 1, name: 'U' });
  fetchMenus.mockResolvedValue([{ code: 'M' }]);
  fetchAppsByUser.mockResolvedValue([{ code: 'A' }]);
});

describe('HeaderDataProvider', () => {
  const base = { config: { previewMode: false, layoutData }, token: 'T', baseUrl: 'http://am' };

  it('keeps non-overridden header config in production', async () => {
    const el = await HeaderDataProvider(base as never);
    // The fields production does NOT override must survive — this is the trap
    // the `layoutMockData` -> `layoutData` rename existed to stop people walking into.
    expect(props(el).data).toMatchObject({ settingsUrl: '/s', user: { id: 1 } });
  });

  // The trigger now learns about the sidebar from IGRPRootProvidersFull's context.
  it('passes showIGRPSidebarTrigger through untouched', async () => {
    const el = await HeaderDataProvider(base as never);
    expect(props(el).data.showIGRPSidebarTrigger).toBe(true);
  });

  it('renders the default header with the slots, or the children composition', async () => {
    const slots = { actions: 'A' };
    const el = await HeaderDataProvider({ ...base, headerSlots: slots } as never);
    expect(props(el).children.type).toBe(Header);
    expect(props(el).children.props.slots).toBe(slots);

    const custom = await HeaderDataProvider({ ...base, children: 'CUSTOM' } as never);
    expect(props(custom).children).toBe('CUSTOM');
  });

  it('fills the palette from the menus when no search slot is given', async () => {
    getHeaderData.mockResolvedValue({ showSearch: true });
    const el = await HeaderDataProvider({
      ...base,
      config: { ...base.config, appCode: 'APP' },
    } as never);
    await expect(props(el).paletteCommands).resolves.toEqual([{ id: 'M', label: 'M', href: '/M' }]);
    expect(fetchMenus).toHaveBeenCalledWith('APP');
  });

  it('builds no palette when a search slot replaces it', async () => {
    getHeaderData.mockResolvedValue({ showSearch: true });
    const el = await HeaderDataProvider({ ...base, headerSlots: { search: 'S' } } as never);
    expect(props(el).paletteCommands).toBeUndefined();
  });

  it('resolves an empty palette when the menu fetch fails', async () => {
    getHeaderData.mockResolvedValue({ showSearch: true });
    fetchMenus.mockRejectedValue(new Error('AM 500'));
    const el = await HeaderDataProvider({
      ...base,
      config: { ...base.config, appCode: 'APP' },
    } as never);
    await expect(props(el).paletteCommands).resolves.toEqual([]);
  });

  it('uses layoutData.getUser in preview mode instead of the data user', async () => {
    const getUser = vi.fn().mockResolvedValue({ id: 9 });
    const el = await HeaderDataProvider({
      ...base,
      config: { previewMode: true, layoutData: { ...layoutData, getUser } },
    } as never);
    expect(fetchCurrentUser).not.toHaveBeenCalled();
    expect(props(el).data.user).toEqual({ id: 9 });
  });

  it('uses layoutData.getUser in production instead of Access Management', async () => {
    const getUser = vi.fn().mockResolvedValue({ id: 9 });
    const el = await HeaderDataProvider({
      ...base,
      config: { previewMode: false, layoutData: { ...layoutData, getUser } },
    } as never);
    expect(fetchCurrentUser).not.toHaveBeenCalled();
    expect(props(el).data.user).toEqual({ id: 9 });
  });

  it('does not fetch the user in preview mode', async () => {
    const el = await HeaderDataProvider({
      ...base,
      config: { previewMode: true, layoutData },
    } as never);
    expect(fetchCurrentUser).not.toHaveBeenCalled();
    expect(setConfig).not.toHaveBeenCalled();
    expect(props(el).data.settingsUrl).toBe('/s');
  });

  it('threads the per-request timeout into the access-client store', async () => {
    await HeaderDataProvider({ ...base, timeout: 2500 } as never);
    expect(setConfig).toHaveBeenCalledWith({ token: 'T', baseUrl: 'http://am', timeout: 2500 });
  });

  it('omits timeout entirely when the config does not set one', async () => {
    await HeaderDataProvider(base as never);
    expect(setConfig).toHaveBeenCalledWith({ token: 'T', baseUrl: 'http://am' });
  });

  it('wraps a transport failure as IGRP_LAYOUT_DATA_FAILED, keeping the cause', async () => {
    const boom = new Error('AM 500');
    fetchCurrentUser.mockRejectedValue(boom);
    await expect(HeaderDataProvider(base as never)).rejects.toMatchObject({
      code: 'IGRP_LAYOUT_DATA_FAILED',
      cause: boom,
    });
  });

  it('lets a redirect out instead of wrapping it', async () => {
    fetchCurrentUser.mockRejectedValue(REDIRECT);
    await expect(HeaderDataProvider(base as never)).rejects.toBe(REDIRECT);
  });
});

describe('SidebarDataProvider', () => {
  const base = {
    config: { previewMode: false, appCode: 'APP', layoutData },
    token: 'T',
    baseUrl: 'http://am',
  };

  it('merges fetched data over the configured sidebar data', async () => {
    const el = await SidebarDataProvider(base as never);
    expect(props(el).data).toMatchObject({
      showAppSwitcher: true,
      menuItems: [{ code: 'M' }],
      apps: [{ code: 'A' }],
      appCode: 'APP',
      user: { id: 1 },
    });
  });

  // The field was written by this provider and read by nobody; it is now removed.
  it('no longer writes the dead showPreviewMode field', async () => {
    const el = await SidebarDataProvider(base as never);
    expect(props(el).data).not.toHaveProperty('showPreviewMode');
  });

  it('short-circuits in preview mode without any fetch', async () => {
    const el = await SidebarDataProvider({
      ...base,
      config: { previewMode: true, appCode: 'APP', layoutData },
    } as never);
    expect(fetchMenus).not.toHaveBeenCalled();
    expect(fetchAppsByUser).not.toHaveBeenCalled();
    expect(props(el).data).toEqual({ showAppSwitcher: true, defaultOpen: false });
  });

  it('uses the layoutData methods in preview mode, mapped like fetched data', async () => {
    const getMenus = vi.fn().mockResolvedValue([{ code: 'PM', extra: 1 }]);
    const getUser = vi.fn().mockResolvedValue({ id: 7 });
    const getApps = vi.fn().mockResolvedValue([{ code: 'PA' }]);
    const el = await SidebarDataProvider({
      ...base,
      config: {
        previewMode: true,
        appCode: 'APP',
        layoutData: { ...layoutData, getMenus, getUser, getApps },
      },
    } as never);
    expect(fetchMenus).not.toHaveBeenCalled();
    expect(getMenus).toHaveBeenCalledWith('APP');
    expect(props(el).data.menuItems[0]).toMatchObject({ code: 'PM', roles: [] });
    expect(props(el).data.menuItems[0]).not.toHaveProperty('extra');
    expect(props(el).data).toMatchObject({ user: { id: 7 }, apps: [{ code: 'PA' }] });
    // Preview keeps the authored appCode (none here).
    expect(props(el).data).not.toHaveProperty('appCode');
  });

  it('uses layoutData.getMenus in production, without needing an appCode', async () => {
    const getMenus = vi.fn().mockResolvedValue([{ code: 'LM' }]);
    const el = await SidebarDataProvider({
      ...base,
      config: { previewMode: false, appCode: '', layoutData: { ...layoutData, getMenus } },
    } as never);
    expect(fetchMenus).not.toHaveBeenCalled();
    expect(fetchCurrentUser).toHaveBeenCalled();
    expect(props(el).data.menuItems[0]).toMatchObject({ code: 'LM' });
  });

  it('renders the default sidebar, or the children composition', async () => {
    const el = await SidebarDataProvider(base as never);
    expect(props(el).children.type).toBe(Sidebar);
    const custom = await SidebarDataProvider({ ...base, children: 'CUSTOM' } as never);
    expect(props(custom).children).toBe('CUSTOM');
  });

  it('throws a coded error when appCode is missing outside preview mode', async () => {
    await expect(
      SidebarDataProvider({
        ...base,
        config: { previewMode: false, appCode: '', layoutData },
      } as never),
    ).rejects.toMatchObject({ code: 'IGRP_APP_CODE_MISSING' });
  });

  it('lets a redirect out instead of wrapping it', async () => {
    fetchMenus.mockRejectedValue(REDIRECT);
    await expect(SidebarDataProvider(base as never)).rejects.toBe(REDIRECT);
  });

  it('wraps a transport failure as IGRP_LAYOUT_DATA_FAILED', async () => {
    fetchMenus.mockRejectedValue(new Error('AM 500'));
    await expect(SidebarDataProvider(base as never)).rejects.toMatchObject({
      code: 'IGRP_LAYOUT_DATA_FAILED',
      context: { appCode: 'APP' },
    });
  });
});

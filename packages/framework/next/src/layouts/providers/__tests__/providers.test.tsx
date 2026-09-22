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
vi.mock('@igrp/framework-next-ui', () => ({
  IGRPTemplateHeader: Header,
  IGRPTemplateSidebar: Sidebar,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const el = await HeaderDataProvider({ ...base, showSidebar: true } as never);
    // The fields production does NOT override must survive — this is the trap
    // the `layoutMockData` rename exists to stop people walking into.
    expect(props(el).data).toMatchObject({ settingsUrl: '/s', user: { id: 1 } });
  });

  it('suppresses the sidebar trigger when the layout renders no sidebar', async () => {
    const el = await HeaderDataProvider({ ...base, showSidebar: false } as never);
    expect(props(el).data.showIGRPSidebarTrigger).toBe(false);
  });

  it('does not fetch the user in preview mode', async () => {
    const el = await HeaderDataProvider({
      ...base,
      config: { previewMode: true, layoutData },
      showSidebar: true,
    } as never);
    expect(fetchCurrentUser).not.toHaveBeenCalled();
    expect(setConfig).not.toHaveBeenCalled();
    expect(props(el).data.settingsUrl).toBe('/s');
  });

  it('threads the per-request timeout into the access-client store', async () => {
    await HeaderDataProvider({ ...base, showSidebar: true, timeout: 2500 } as never);
    expect(setConfig).toHaveBeenCalledWith({ token: 'T', baseUrl: 'http://am', timeout: 2500 });
  });

  it('omits timeout entirely when the config does not set one', async () => {
    await HeaderDataProvider({ ...base, showSidebar: true } as never);
    expect(setConfig).toHaveBeenCalledWith({ token: 'T', baseUrl: 'http://am' });
  });

  it('wraps a transport failure as IGRP_LAYOUT_DATA_FAILED, keeping the cause', async () => {
    const boom = new Error('AM 500');
    fetchCurrentUser.mockRejectedValue(boom);
    await expect(HeaderDataProvider({ ...base, showSidebar: true } as never)).rejects.toMatchObject(
      { code: 'IGRP_LAYOUT_DATA_FAILED', cause: boom },
    );
  });

  it('lets a redirect out instead of wrapping it', async () => {
    fetchCurrentUser.mockRejectedValue(REDIRECT);
    await expect(HeaderDataProvider({ ...base, showSidebar: true } as never)).rejects.toBe(
      REDIRECT,
    );
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

  // Repo KNOWN-ISSUES #3 — written by this provider, read by nobody.
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

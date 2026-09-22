import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * `IGRPLayoutFull` is the only place that reads `apiManagementConfig.timeout`
 * and hands it to the two providers. The provider tests prove they *use* a
 * timeout prop; nothing proved the layout *passes* one — so removing the
 * threading left the whole suite green while `apiManagementConfig.timeout` went
 * back to being dead config. This closes that link.
 */

const RootProviders = (p: unknown) => ({ __marker: 'root', p });
vi.mock('@igrp/framework-next-ui', () => ({
  IGRPRootProvidersFull: RootProviders,
  IGRPLayoutErrorBoundary: (p: unknown) => ({ __marker: 'boundary', p }),
  IGRPHeaderSkeleton: () => null,
  IGRPSidebarSkeleton: () => null,
  IGRPHeaderError: () => null,
  IGRPSidebarError: () => null,
}));

const setConfig = vi.fn();
vi.mock('../../lib/api-config.js', () => ({ igrpSetAccessClientConfig: setConfig }));

const HeaderDataProvider = (p: unknown) => ({ __marker: 'header', p });
const SidebarDataProvider = (p: unknown) => ({ __marker: 'sidebar', p });
vi.mock('../providers/header-data-provider.js', () => ({ HeaderDataProvider }));
vi.mock('../providers/sidebar-data-provider.js', () => ({ SidebarDataProvider }));

const { IGRPLayoutFull } = await import('../igrp-layout-full.js');

const layoutData = { getHeaderData: async () => ({}), getSidebarData: async () => ({}) };

/** Depth-first search for the element rendering `type`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findElement(node: any, type: unknown): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findElement(child, type);
      if (hit) return hit;
    }
    return null;
  }
  if (node.type === type) return node;
  return node.props ? findElement(node.props.children ?? null, type) : null;
}

const config = (overrides: Record<string, unknown> = {}) =>
  ({
    previewMode: false,
    layout: { session: { accessToken: 'AT' } },
    apiManagementConfig: { baseUrl: 'http://am' },
    toasterConfig: { showToaster: false },
    layoutData,
    ...overrides,
  }) as never;

beforeEach(() => vi.clearAllMocks());

describe('IGRPLayoutFull wiring', () => {
  it('passes apiManagementConfig.timeout to both providers', async () => {
    const el = await IGRPLayoutFull({
      children: null,
      config: config({ apiManagementConfig: { baseUrl: 'http://am', timeout: 2500 } }),
    });

    const header = findElement(el.props.header, HeaderDataProvider);
    const sidebar = findElement(el.props.sidebar, SidebarDataProvider);
    expect(header.props.timeout).toBe(2500);
    expect(sidebar.props.timeout).toBe(2500);
  });

  it('seeds the access-client store with that timeout', async () => {
    await IGRPLayoutFull({
      children: null,
      config: config({ apiManagementConfig: { baseUrl: 'http://am', timeout: 2500 } }),
    });
    expect(setConfig).toHaveBeenCalledWith({
      token: 'AT',
      baseUrl: 'http://am',
      timeout: 2500,
    });
  });

  it('leaves timeout undefined when the config omits it', async () => {
    const el = await IGRPLayoutFull({ children: null, config: config() });
    expect(findElement(el.props.header, HeaderDataProvider).props.timeout).toBeUndefined();
    expect(setConfig).toHaveBeenCalledWith({ token: 'AT', baseUrl: 'http://am' });
  });

  it('renders no sidebar slot when showSidebar is false', async () => {
    const el = await IGRPLayoutFull({ children: null, config: config(), showSidebar: false });
    expect(el.props.sidebar).toBeUndefined();
  });

  it('honours defaultSidebarOpen, defaulting to true', async () => {
    const open = await IGRPLayoutFull({ children: null, config: config() });
    expect(open.props.defaultOpen).toBe(true);

    const closed = await IGRPLayoutFull({
      children: null,
      config: config(),
      defaultSidebarOpen: false,
    });
    expect(closed.props.defaultOpen).toBe(false);
  });
});

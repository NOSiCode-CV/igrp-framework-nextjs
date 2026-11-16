// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Stable, like Next's: the header search memoizes its palette items on it.
const router = vi.hoisted(() => ({ push: () => {}, refresh: () => {} }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSelectedLayoutSegments: () => ['url-segment'],
  usePathname: () => '/',
}));

const { SidebarProvider, TooltipProvider } =
  await import('@igrp/igrp-framework-react-design-system');
const { IGRPTemplateHeader } = await import('../header.js');
const {
  IGRPHeaderBreadcrumbs,
  IGRPHeaderDataProvider,
  IGRPHeaderSearch,
  IGRPHeaderTitle,
  IGRPHeaderUser,
} = await import('../header-parts.js');
const { IGRPRootProvidersFull } = await import('../../providers/root-full.js');
const { IGRPTemplateBreadcrumbs } = await import('../breadcrumbs.js');
const { IGRPBreadcrumbsProvider, IGRPPageBreadcrumbs } =
  await import('../../providers/breadcrumbs.js');
const { IGRPCommandPaletteProvider, useIGRPCommandPalette } =
  await import('../../providers/command-palette.js');
const { IGRPTemplateCommandSearch } = await import('../command-search.js');
await import('../command-palette.js');
const { igrpMenusToPaletteCommands } = await import('../menus/palette-commands.js');
const { IGRPChromeI18nProvider, useIGRPChromeI18n } = await import('../../i18n/context.js');
const { IGRP_CHROME_STRINGS_EN } = await import('../../i18n/strings.en.js');

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
});

function mount(ui: React.ReactNode) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(ui));
  return container;
}

const menu = (o: Record<string, unknown>) =>
  ({ status: 'ACTIVE', type: 'MENU_PAGE', position: 0, ...o }) as never;

describe('igrpMenusToPaletteCommands', () => {
  it('lists what the sidebar shows, grouped by folder, with sidebar hrefs', () => {
    const commands = igrpMenusToPaletteCommands([
      menu({ code: 'F', name: 'Folder', type: 'FOLDER' }),
      menu({ code: 'A', name: 'Alpha', pageSlug: 'alpha', parentCode: 'F' }),
      menu({ code: 'X', name: 'Ext', type: 'EXTERNAL_PAGE', url: 'https://x.test' }),
      menu({ code: 'N', name: 'Nowhere' }),
      menu({ code: 'I', name: 'Inactive', pageSlug: 'i', status: 'INACTIVE' }),
    ]);
    expect(commands).toEqual([
      { id: 'A', label: 'Alpha', group: 'Folder', href: '/alpha' },
      { id: 'X', label: 'Ext', href: 'https://x.test', external: true },
    ]);
  });
});

describe('IGRPTemplateHeader', () => {
  it('renders a supplied slot even when its flag is off', () => {
    const html = renderToString(
      <SidebarProvider>
        <IGRPTemplateHeader
          data={{ showSearch: false }}
          slots={{ search: <span>MY-SEARCH</span>, settings: <span>MY-SETTINGS</span> }}
        />
      </SidebarProvider>,
    );
    expect(html).toContain('MY-SEARCH');
    expect(html).toContain('MY-SETTINGS');
  });

  it('reads its data from IGRPHeaderDataProvider when given none', () => {
    const html = renderToString(
      <SidebarProvider>
        <IGRPHeaderDataProvider data={{ showIGRPHeaderTitle: true }}>
          <IGRPTemplateHeader />
        </IGRPHeaderDataProvider>
      </SidebarProvider>,
    );
    expect(html).toContain('iGRP');
  });

  it('hides the sidebar trigger when the layout has no sidebar', () => {
    const header = <IGRPTemplateHeader data={{ showIGRPSidebarTrigger: true }} />;
    const without = renderToString(
      <IGRPRootProvidersFull header={header} toaster={null}>
        {null}
      </IGRPRootProvidersFull>,
    );
    const withSidebar = renderToString(
      <IGRPRootProvidersFull header={header} sidebar={<nav />} toaster={null}>
        {null}
      </IGRPRootProvidersFull>,
    );
    expect(without).not.toContain('data-sidebar="trigger"');
    expect(withSidebar).toContain('data-sidebar="trigger"');
  });

  it('threads header label props into the chrome catalog', () => {
    const html = renderToString(
      <SidebarProvider>
        <IGRPTemplateHeader data={{ showSettings: true }} settingsLabel="Prefs" />
      </SidebarProvider>,
    );
    expect(html).toContain('aria-label="Prefs"');
  });
});

describe('header parts', () => {
  it('IGRPHeaderTitle takes children', () => {
    expect(renderToString(<IGRPHeaderTitle>Acme</IGRPHeaderTitle>)).toContain('Acme');
  });

  it('IGRPHeaderUser uses the header variant (avatar only)', () => {
    const html = renderToString(
      <TooltipProvider>
        <SidebarProvider>
          <IGRPHeaderDataProvider data={{ user: { name: 'Ana Silva', email: 'a@x.cv' } as never }}>
            <IGRPHeaderUser />
          </IGRPHeaderDataProvider>
        </SidebarProvider>
      </TooltipProvider>,
    );
    expect(html).not.toContain('Ana Silva');
  });
});

describe('IGRPChromeI18nProvider overrides', () => {
  function Probe() {
    const s = useIGRPChromeI18n();
    return <span>{`${s.navUser.logout}|${s.navUser.profile}`}</span>;
  }

  it('merges over the parent catalog key by key and ignores undefined', () => {
    const html = renderToString(
      <IGRPChromeI18nProvider strings={IGRP_CHROME_STRINGS_EN}>
        <IGRPChromeI18nProvider overrides={{ navUser: { logout: 'Leave', profile: undefined } }}>
          <Probe />
        </IGRPChromeI18nProvider>
      </IGRPChromeI18nProvider>,
    );
    expect(html).toContain('Leave|Profile');
  });
});

describe('page breadcrumbs', () => {
  const PAGE_ITEMS = [{ label: 'FromPage', href: '/pg' }];

  it('win over the header trail in IGRPHeaderBreadcrumbs, which returns when the page unmounts', () => {
    function Harness() {
      const [page, setPage] = useState(true);
      return (
        <IGRPBreadcrumbsProvider>
          <IGRPHeaderDataProvider breadcrumbs={[{ label: 'FromHeader', href: '/h' }]}>
            <IGRPHeaderBreadcrumbs />
          </IGRPHeaderDataProvider>
          {page && <IGRPPageBreadcrumbs items={PAGE_ITEMS} />}
          <button type="button" onClick={() => setPage(false)}>
            leave
          </button>
        </IGRPBreadcrumbsProvider>
      );
    }
    const host = mount(<Harness />);
    expect(host.textContent).toContain('FromPage');
    act(() => host.querySelector('button')!.click());
    expect(host.textContent).toContain('FromHeader');
    expect(host.textContent).not.toContain('FromPage');
  });

  it('never override the explicit items of an IGRPTemplateBreadcrumbs', () => {
    const host = mount(
      <IGRPBreadcrumbsProvider>
        <IGRPTemplateBreadcrumbs items={[{ label: 'FromProp', href: '/p' }]} />
        <IGRPPageBreadcrumbs items={PAGE_ITEMS} />
      </IGRPBreadcrumbsProvider>,
    );
    expect(host.textContent).toContain('FromProp');
    expect(host.textContent).not.toContain('FromPage');
  });
});

const ctrlK = () => new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
const paletteInputs = () => document.body.querySelectorAll('[data-slot="command-input"]');

describe('IGRPCommandPaletteProvider', () => {
  function Opener() {
    const { actions } = useIGRPCommandPalette();
    return (
      <button type="button" data-testid="opener" onClick={actions.open}>
        open
      </button>
    );
  }

  it('leaves Ctrl+K to the browser when no palette is rendered', async () => {
    mount(
      <IGRPCommandPaletteProvider>
        <Opener />
      </IGRPCommandPaletteProvider>,
    );
    const event = ctrlK();
    await act(async () => {
      document.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
  });

  it('is toggled by the search on ⌘K and opened by any component', async () => {
    mount(
      <IGRPCommandPaletteProvider>
        <IGRPTemplateCommandSearch commands={[]} />
        <Opener />
      </IGRPCommandPaletteProvider>,
    );
    expect(paletteInputs()).toHaveLength(0);

    const event = ctrlK();
    await act(async () => {
      document.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(paletteInputs()).toHaveLength(1);

    await act(async () => {
      document.dispatchEvent(ctrlK());
    });
    await act(async () => {
      (document.querySelector('[data-testid="opener"]') as HTMLButtonElement).click();
    });
    expect(paletteInputs()).toHaveLength(1);
  });

  it('is toggled once when two searches are mounted', async () => {
    mount(
      <IGRPCommandPaletteProvider>
        <IGRPTemplateCommandSearch commands={[]} />
        <IGRPTemplateCommandSearch commands={[]} />
      </IGRPCommandPaletteProvider>,
    );
    await act(async () => {
      document.dispatchEvent(ctrlK());
    });
    // A double toggle would leave it closed. (Both instances render the shared
    // open state, so each mounts its dialog: one input per instance.)
    expect(paletteInputs().length).toBeGreaterThan(0);
  });

  it('useIGRPCommandPalette throws outside the provider', () => {
    expect(() => renderToString(<Opener />)).toThrow(/IGRPCommandPaletteProvider/);
  });
});

describe('IGRPTemplateCommandSearch without a provider', () => {
  it('opens one palette when two are mounted', async () => {
    mount(
      <>
        <IGRPTemplateCommandSearch commands={[]} />
        <IGRPTemplateCommandSearch commands={[]} />
      </>,
    );
    await act(async () => {
      document.dispatchEvent(ctrlK());
    });
    expect(paletteInputs()).toHaveLength(1);
  });
});

describe('IGRPHeaderSearch', () => {
  it('keeps one trigger, open, while streamed palette commands arrive', async () => {
    let resolve!: (commands: { id: string; label: string; href: string }[]) => void;
    const commands = new Promise<{ id: string; label: string; href: string }[]>((r) => {
      resolve = r;
    });
    const host = mount(
      <IGRPCommandPaletteProvider>
        <IGRPHeaderDataProvider paletteCommands={commands}>
          <IGRPHeaderSearch />
        </IGRPHeaderDataProvider>
      </IGRPCommandPaletteProvider>,
    );
    const trigger = host.querySelector('button');
    expect(trigger).not.toBeNull();

    await act(async () => {
      document.dispatchEvent(ctrlK());
    });
    expect(paletteInputs()).toHaveLength(1);

    await act(async () => {
      resolve([{ id: 'A', label: 'Alpha', href: '/alpha' }]);
    });
    expect(host.querySelector('button')).toBe(trigger);
    expect(paletteInputs()).toHaveLength(1);
    const items = [...document.body.querySelectorAll('[data-slot="command-item"]')];
    expect(items.map((el) => el.textContent)).toEqual(['Alpha']);
  });

  it('lists commands from an RSC-style thenable whose then() returns undefined', async () => {
    const resolved = [{ id: 'B', label: 'Beta', href: '/beta' }];
    // Mirrors React Flight's chunk: `then` registers callbacks and returns nothing.
    const thenable = {
      then(onFulfilled: (value: typeof resolved) => void) {
        onFulfilled(resolved);
      },
    } as unknown as Promise<typeof resolved>;
    mount(
      <IGRPCommandPaletteProvider>
        <IGRPHeaderDataProvider paletteCommands={thenable}>
          <IGRPHeaderSearch />
        </IGRPHeaderDataProvider>
      </IGRPCommandPaletteProvider>,
    );
    await act(async () => {
      document.dispatchEvent(ctrlK());
    });
    const items = [...document.body.querySelectorAll('[data-slot="command-item"]')];
    expect(items.map((el) => el.textContent)).toEqual(['Beta']);
  });
});

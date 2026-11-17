// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
  useSelectedLayoutSegments: () => [],
  usePathname: () => '/',
}));

const { SidebarProvider, TooltipProvider } =
  await import('@igrp/igrp-framework-react-design-system');
const { IGRPRootProvidersFull, IGRP_MAIN_CONTENT_ID } =
  await import('../../providers/root-full.js');
const { IGRPHeaderDataProvider, IGRPHeaderRoot, IGRPHeaderUser } =
  await import('../header-parts.js');
const { IGRPAuthCarousel } = await import('../../auths/carousel.js');
const { IGRPHeaderError } = await import('../header-error.js');
const { IGRPSidebarError } = await import('../sidebar-error.js');
const { IGRPSegmentError } = await import('../../errors/segment.js');

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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
  vi.useRealTimers();
});

function mount(ui: React.ReactNode) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(ui));
  return container;
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

describe.each([
  ['with a sidebar', <nav key="s">SIDEBAR</nav>],
  ['without a sidebar', undefined],
])('IGRPRootProvidersFull landmarks %s', (_name, sidebar) => {
  const view = () =>
    mount(
      <IGRPRootProvidersFull
        sidebar={sidebar}
        header={
          <IGRPHeaderRoot>
            <a href="/home">Home</a>
          </IGRPHeaderRoot>
        }
        toaster={null}
      >
        <p>PAGE</p>
      </IGRPRootProvidersFull>,
    );

  it('opens with a skip link to the main content', () => {
    const el = view();
    const first = el.querySelector(FOCUSABLE) as HTMLAnchorElement;
    expect(first.getAttribute('href')).toBe(`#${IGRP_MAIN_CONTENT_ID}`);
    expect(first.textContent).toBe('Saltar para o conteúdo');
    expect(el.querySelector(`main#${IGRP_MAIN_CONTENT_ID}`)).not.toBeNull();
  });

  it('has exactly one main, holding only the page, with the header outside it', () => {
    const el = view();
    const mains = el.querySelectorAll('main');
    expect(mains).toHaveLength(1);
    expect(mains[0]!.textContent).toBe('PAGE');
    const header = el.querySelector('header');
    expect(header).not.toBeNull();
    expect(header!.closest('main')).toBeNull();
  });
});

describe('header user menu', () => {
  it('names the trigger after the user, not the initials', () => {
    const el = mount(
      <TooltipProvider>
        <SidebarProvider>
          <IGRPHeaderDataProvider data={{ user: { name: 'Ana Silva', email: 'a@x.cv' } as never }}>
            <IGRPHeaderUser />
          </IGRPHeaderDataProvider>
        </SidebarProvider>
      </TooltipProvider>,
    );
    const trigger = el.querySelector('button')!;
    expect(trigger.getAttribute('aria-label')).toBe('Menu do utilizador, Ana Silva');
  });
});

describe('auth carousel', () => {
  const items = [
    { image: '/a.png', title: 'A', description: 'a' },
    { image: '/b.png', title: 'B', description: 'b' },
  ];
  const current = (el: HTMLElement) =>
    el.querySelector('[aria-current="true"]')?.getAttribute('aria-label');

  it('stops rotating when paused and resumes on play', () => {
    vi.useFakeTimers();
    const el = mount(<IGRPAuthCarousel carouselItems={items} intervalTime={1000} />);
    // jsdom has no layout: offsetParent is always null, which the carousel reads as hidden.
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent')!;
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get: () => document.body,
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(current(el)).toBe('Ir para o destaque 2');

    const pause = el.querySelector('button[aria-label="Pausar destaques"]') as HTMLButtonElement;
    act(() => pause.click());
    act(() => vi.advanceTimersByTime(5000));
    expect(current(el)).toBe('Ir para o destaque 2');

    const play = el.querySelector('button[aria-label="Retomar destaques"]') as HTMLButtonElement;
    expect(play).not.toBeNull();
    act(() => play.click());
    act(() => vi.advanceTimersByTime(1000));
    expect(current(el)).toBe('Ir para o destaque 1');
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', original);
  });
});

describe('error panels', () => {
  it('announce themselves with role="alert"', () => {
    expect(renderToString(<IGRPHeaderError />)).toContain('role="alert"');
    expect(renderToString(<IGRPSidebarError />)).toContain('role="alert"');
    expect(
      renderToString(<IGRPSegmentError error={new Error('x')} reset={() => {}} />),
    ).toContain('role="alert"');
  });
});

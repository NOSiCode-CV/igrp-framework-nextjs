// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
  usePathname: () => '/',
}));

const { SidebarProvider, TooltipProvider } =
  await import('@igrp/igrp-framework-react-design-system');
const { IGRPSidebarDataProvider, IGRPSidebarUser } = await import('../sidebar.js');

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
});

const user = { name: 'Ana', email: 'ana@example.cv' };

/** Mounts the sidebar user menu, opens it and returns the entries' hrefs. */
function openMenu(ui: React.ReactNode): string[] {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TooltipProvider>
        <SidebarProvider>{ui}</SidebarProvider>
      </TooltipProvider>,
    ),
  );
  const trigger = container.querySelector('button')!;
  act(() => {
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  return [...document.querySelectorAll('[role="menu"] a')].map((a) => a.getAttribute('href')!);
}

describe('IGRPSidebarUser', () => {
  it('links profile and settings to the sidebar data URLs', () => {
    const hrefs = openMenu(
      <IGRPSidebarDataProvider
        data={{ user, profileUrl: 'https://am.cv/profile', settingsUrl: 'https://am.cv/settings' }}
      >
        <IGRPSidebarUser />
      </IGRPSidebarDataProvider>,
    );
    expect(hrefs).toContain('https://am.cv/profile');
    expect(hrefs).toContain('https://am.cv/settings');
  });

  it('hides profile, settings and notifications from the data flags', () => {
    const hrefs = openMenu(
      <IGRPSidebarDataProvider
        data={{ user, showProfile: false, showSettings: false, showNotifications: false }}
      >
        <IGRPSidebarUser />
      </IGRPSidebarDataProvider>,
    );
    expect(hrefs).toEqual(['/logout']);
  });

  it('lets a prop override the data flag', () => {
    const hrefs = openMenu(
      <IGRPSidebarDataProvider data={{ user, showSettings: false }}>
        <IGRPSidebarUser showSettings />
      </IGRPSidebarDataProvider>,
    );
    expect(hrefs).toContain('/settings');
  });
});

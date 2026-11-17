// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { SidebarProvider, TooltipProvider } from '@igrp/igrp-framework-react-design-system';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ prefetch: vi.fn() }),
}));

const { IGRPTemplateMenus } = await import('../menus.js');

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia ??= (() => ({
    matches: false,
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
  container = undefined;
});

const menus = [
  { code: 'a', name: 'Alpha', status: 'ACTIVE', type: 'MENU', pageSlug: 'a' },
] as unknown as IGRPMenuItemArgs[];

describe('IGRPTemplateMenus controlled query', () => {
  it('shows the controlled query and reports changes without owning it', () => {
    const onQueryChange = vi.fn();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() =>
      root!.render(
        <SidebarProvider>
          <IGRPTemplateMenus menus={menus} showSearch query="alp" onQueryChange={onQueryChange} />
        </SidebarProvider>,
      ),
    );
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(input.value).toBe('alp');

    act(() => container!.querySelector<HTMLButtonElement>('button[aria-label]')!.click());

    expect(onQueryChange).toHaveBeenCalledWith('');
    // Controlled: the menu does not clear the caller's value on its own.
    expect(input.value).toBe('alp');
  });

  it('announces the result summary in a status region that stays mounted', () => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    const render = (query: string) =>
      act(() =>
        root!.render(
          <TooltipProvider>
            <SidebarProvider>
              <IGRPTemplateMenus menus={menus} showSearch query={query} />
            </SidebarProvider>
          </TooltipProvider>,
        ),
      );
    render('');
    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toBe('');

    render('alp');
    expect(container.querySelector('[role="status"]')).toBe(status);
    expect(status?.textContent).toMatch(/1/);

    render('zzz');
    expect(container.querySelector('[role="status"]')).toBe(status);
    expect(status?.textContent).toContain('zzz');
  });
});

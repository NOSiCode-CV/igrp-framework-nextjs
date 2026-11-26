// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch: vi.fn() }) }));

const { MenuItemLink } = await import('../menu-item-link.js');

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllEnvs();
});

function anchorHref(href: string): string | null {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <MenuItemLink href={href} isAnchor isActive={false} target="_blank">
        x
      </MenuItemLink>,
    ),
  );
  return container.querySelector('a')!.getAttribute('href');
}

describe('MenuItemLink anchor branch', () => {
  it('adds the basePath to an internal href', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/apps/template');
    expect(anchorHref('/users')).toBe('/apps/template/users');
  });

  it('leaves an absolute URL alone', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/apps/template');
    expect(anchorHref('https://example.com/x')).toBe('https://example.com/x');
  });
});

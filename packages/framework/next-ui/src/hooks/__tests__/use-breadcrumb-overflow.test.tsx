// @vitest-environment jsdom
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useBreadcrumbOverflow } from '../use-breadcrumb-overflow.js';

let resize: () => void = () => {};
let clientWidth = 300;
const NATURAL = 400;
const COLLAPSED = 150;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.requestAnimationFrame = (cb) => {
    cb(0);
    return 0;
  };
  globalThis.cancelAnimationFrame = () => {};
  globalThis.ResizeObserver = class {
    constructor(cb: () => void) {
      resize = cb;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

let root: Root | undefined;
afterEach(() => act(() => root?.unmount()));

function Trail() {
  const ref = useRef<HTMLDivElement>(null);
  const collapsed = useBreadcrumbOverflow(ref, 'a|b|c');
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (!el) return;
        // The list's content width depends on what is rendered.
        Object.defineProperty(el, 'scrollWidth', {
          configurable: true,
          get: () => (el.dataset.collapsed === 'true' ? COLLAPSED : NATURAL),
        });
        Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => clientWidth });
      }}
      data-collapsed={collapsed}
    />
  );
}

describe('useBreadcrumbOverflow', () => {
  it('compares the remembered natural width on resize instead of flipping', () => {
    const container = document.createElement('div');
    root = createRoot(container);
    act(() => root!.render(<Trail />));
    const el = container.firstElementChild as HTMLElement;
    expect(el.dataset.collapsed).toBe('true');

    // Still too narrow: re-reading the collapsed scrollWidth (150) said "fits"
    // and expanded it, only to collapse again on the next measure.
    act(() => resize());
    expect(el.dataset.collapsed).toBe('true');

    clientWidth = 500;
    act(() => resize());
    expect(el.dataset.collapsed).toBe('false');
  });
});

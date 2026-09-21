'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Reports whether the observed element's content is wider than its box.
 *
 * `contentKey` is REQUIRED and load-bearing. The measurement feeds back into
 * what the caller renders (overflow → collapse → fewer children), and a
 * `ResizeObserver` only fires when the observed element's own box changes. The
 * breadcrumb list is `overflow-hidden` inside a flex parent, so swapping its
 * children never resizes it — with deps of `[containerRef]` alone the hook
 * measured once on mount and every later answer was stale: a long trail
 * measured at mount kept its ellipsis after navigating to a two-segment route,
 * and a short one never collapsed after navigating to a long one.
 *
 * Pass something that changes whenever the rendered content does (the joined
 * hrefs, a route key). Re-measuring is a layout read in a rAF, not a render.
 */
export function useBreadcrumbOverflow(
  containerRef: RefObject<HTMLElement | null>,
  contentKey: string,
): boolean {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // `scrollWidth`/`clientWidth` are integers, so a sub-pixel layout can
        // report a 1px phantom overflow forever. Require a real difference.
        setIsOverflowing(el.scrollWidth - el.clientWidth > 1);
      });
    };

    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, contentKey]);

  return isOverflowing;
}

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
 *
 * `collapsed` says the caller collapses for its OWN reasons (item count,
 * mobile). The natural width is read only while the list renders uncollapsed
 * for the current `contentKey`, and remembered; while collapsed, a resize
 * compares that remembered width to `clientWidth`. Re-reading `scrollWidth`
 * from the collapsed list said "fits", which expanded it, which overflowed,
 * which collapsed it again — a flip on every resize.
 */
export function useBreadcrumbOverflow(
  containerRef: RefObject<HTMLElement | null>,
  contentKey: string,
  collapsed = false,
): boolean {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const rafRef = useRef<number | null>(null);
  const naturalWidthRef = useRef<{ key: string; width: number } | null>(null);

  // New content: render it uncollapsed once so its natural width can be read.
  const [measuredKey, setMeasuredKey] = useState(contentKey);
  if (measuredKey !== contentKey) {
    setMeasuredKey(contentKey);
    setIsOverflowing(false);
  }
  const expanded = !collapsed && !isOverflowing;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (expanded) naturalWidthRef.current = { key: contentKey, width: el.scrollWidth };
        const natural = naturalWidthRef.current;
        // Collapsed and never seen expanded for this content: nothing to compare.
        if (natural?.key !== contentKey) return;
        // `scrollWidth`/`clientWidth` are integers, so a sub-pixel layout can
        // report a 1px phantom overflow forever. Require a real difference.
        setIsOverflowing(natural.width - el.clientWidth > 1);
      });
    };

    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, contentKey, expanded]);

  return isOverflowing;
}

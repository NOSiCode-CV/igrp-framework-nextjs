'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export function useBreadcrumbOverflow(containerRef: RefObject<HTMLElement | null>): boolean {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setIsOverflowing(el.scrollWidth > el.clientWidth);
      });
    };

    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  return isOverflowing;
}

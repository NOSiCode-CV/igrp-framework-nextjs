'use client';

import { createContext, use, useLayoutEffect, useState } from 'react';

import type { BreadcrumbItem } from '../templates/breadcrumbs.js';

type SetItems = (
  update: (current: BreadcrumbItem[] | undefined) => BreadcrumbItem[] | undefined,
) => void;

// Two contexts: pages that only set items never re-render when the items change.
const ItemsContext = createContext<BreadcrumbItem[] | undefined>(undefined);
const SetItemsContext = createContext<SetItems | null>(null);

/**
 * Holds the breadcrumb trail a page declares. Mounted by `IGRPRootProvidersFull`;
 * `IGRPHeaderBreadcrumbs` prefers these items over the header's `breadcrumbs`.
 */
export function IGRPBreadcrumbsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[] | undefined>(undefined);
  return (
    <SetItemsContext value={setItems}>
      <ItemsContext value={items}>{children}</ItemsContext>
    </SetItemsContext>
  );
}

/** The page-declared trail, or `undefined` when no page declared one. Internal. */
export function useIGRPBreadcrumbItems(): BreadcrumbItem[] | undefined {
  return use(ItemsContext);
}

/**
 * Declares the header breadcrumb trail for as long as the calling component is
 * mounted, and clears it on unmount. Without a provider (no `IGRPLayoutFull`)
 * it does nothing.
 *
 * Pass a stable array (a server prop, a module constant or a memoized value):
 * a new array on every render re-sets the trail on every render.
 */
export function useIGRPBreadcrumbs(items: BreadcrumbItem[] | undefined): void {
  const setItems = use(SetItemsContext);
  // Before paint, so the URL/layout trail does not flash on client navigation.
  useLayoutEffect(() => {
    if (!setItems || !items) return;
    setItems(() => items);
    // Clear only our own trail: the next page may already have set its own.
    return () => setItems((current) => (current === items ? undefined : current));
  }, [setItems, items]);
}

export interface IGRPPageBreadcrumbsProps {
  /** The trail after the home item, which the header always renders. */
  items: BreadcrumbItem[];
}

/**
 * Renders nothing; sets the header breadcrumbs from a page.
 *
 * The trail is set in a layout effect, so the server render (and the HTML a
 * full page load first paints) still shows the URL/layout trail. For crumbs
 * that are correct in the server HTML, pass `breadcrumbs` to `IGRPLayoutHeader`.
 *
 * @example
 * <IGRPPageBreadcrumbs items={[{ label: 'Users', href: '/users' }, { label: user.name, href: `/users/${id}` }]} />
 */
export function IGRPPageBreadcrumbs({ items }: IGRPPageBreadcrumbsProps) {
  useIGRPBreadcrumbs(items);
  return null;
}

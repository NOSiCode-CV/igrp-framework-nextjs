import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { igrpNormalizeUrl } from '@igrp/igrp-framework-react-design-system';

export type LeafNode = { kind: 'leaf'; item: IGRPMenuItemArgs };
export type FolderNode = { kind: 'folder'; item: IGRPMenuItemArgs; children: LeafNode[] };
export type TreeNode = LeafNode | FolderNode;
export type Section = { key: string; label?: string; nodes: TreeNode[] };

export function resolveHref(item: IGRPMenuItemArgs): string {
  if (item.pageSlug) {
    // Strip every leading slash/backslash: `//host` or `/\host` would be a cross-origin link.
    return `/${item.pageSlug.replace(/^[/\\]+/, '')}`;
  }
  if (item.url) return igrpNormalizeUrl(item.url);
  return '#';
}

/**
 * Whether a URL leaves the app, decided WITHOUT reading `window`.
 *
 * The design system's `igrpIsExternalUrl` compares against
 * `window.location.origin` inside a `try`, so on the server the ReferenceError
 * is swallowed and it answers `false` for everything. The sidebar renders on the
 * server first, so every external menu item came out as a `next/link`, then
 * re-rendered as an `<a target="_blank">` on the client — a hydration mismatch
 * on the element type, plus a window in which the link had no `rel="noopener"`.
 *
 * A menu item addresses an in-app route through `pageSlug`; a `url` carrying a
 * scheme or protocol-relative prefix means "leave the app", which is the same
 * answer on both sides of hydration.
 */
export function isAbsoluteUrl(url: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url);
}

export function resolveAnchorTag(item: IGRPMenuItemArgs): boolean {
  const isExternal = !item.pageSlug && !!item.url && isAbsoluteUrl(item.url);
  return isExternal || item.target === '_blank';
}

/**
 * Prefix match of a menu item against the current pathname: an item matches its
 * own route and any child route.
 *
 * NOTE: callers pass the value of next/navigation `usePathname()`, which is the
 * route SOURCE path. `basePath` is handled (Next strips it), but apps that add
 * `next.config` rewrites/Proxy may see a mismatch between this and the browser
 * URL. If that ever applies, migrate the sidebar to `useSelectedLayoutSegments()`
 * (router-state based, rewrite-immune) — the same hook breadcrumbs.tsx already uses.
 */
function matchesPathname(item: IGRPMenuItemArgs, pathname: string): boolean {
  const href = resolveHref(item);
  if (resolveAnchorTag(item) || href === '#') return false;
  return pathname === href || pathname.startsWith(href + '/');
}

/**
 * The ONE href the sidebar highlights for `pathname`: the longest matching one.
 * Prefix matching per item made `/admin` and `/admin/users` both current on
 * `/admin/users` (two `aria-current="page"`, two folders auto-opened).
 */
export function findActiveHref(sections: Section[], pathname: string): string | null {
  let best: string | null = null;
  for (const section of sections) {
    for (const node of section.nodes) {
      for (const leaf of node.kind === 'folder' ? node.children : [node]) {
        const href = resolveHref(leaf.item);
        if (matchesPathname(leaf.item, pathname) && (best === null || href.length > best.length)) {
          best = href;
        }
      }
    }
  }
  return best;
}

/** Whether `item` is the entry `findActiveHref` picked. */
export function isItemActive(item: IGRPMenuItemArgs, activeHref: string | null): boolean {
  return activeHref !== null && !resolveAnchorTag(item) && resolveHref(item) === activeHref;
}

/**
 * `activeHref` if `node`'s subtree holds the active entry, else `null`. Passing
 * `null` to the other subtrees keeps their props unchanged across navigation, so
 * the React Compiler skips re-rendering them.
 */
export function activeHrefWithin(node: TreeNode, activeHref: string | null): string | null {
  const leaves = node.kind === 'folder' ? node.children : [node];
  return leaves.some((leaf) => isItemActive(leaf.item, activeHref)) ? activeHref : null;
}

/**
 * Selected-item treatment, driven by dedicated `--sidebar-active` /
 * `--sidebar-active-foreground` tokens (defined in the design system's
 * tokens.css). Integrators recolor the highlight by overriding those tokens in
 * their app CSS — no component change needed. Semantic tokens only. Applied via
 * className so it overrides the DS primitive's lighter
 * `data-[active=true]:bg-sidebar-accent` default (tailwind-merge keeps the last).
 *
 * The svg override recolors sub-item icons (the DS sub-button forces
 * `[&>svg]:text-sidebar-accent-foreground` unconditionally). Hover keeps the same
 * color as the resting active state (pinned, not strengthened) so it never reverts
 * to the faint accent. The `data-[state=open]` compound variant is required for
 * FOLDER triggers: the DS primitive ships `data-[state=open]:hover:bg-sidebar-accent`,
 * which has the same specificity as a plain `data-[active=true]:hover:` rule and
 * would otherwise win and drop the highlight when hovering an open, active folder.
 * The extra attribute raises specificity so the active treatment holds.
 */
export const ACTIVE_MENU_ITEM_CLASS = [
  'data-[active=true]:bg-sidebar-active',
  'data-[active=true]:text-sidebar-active-foreground',
  'data-[active=true]:[&>svg]:text-sidebar-active-foreground',
  'data-[active=true]:hover:bg-sidebar-active',
  'data-[active=true]:hover:text-sidebar-active-foreground',
  'data-[active=true]:data-[state=open]:hover:bg-sidebar-active',
  'data-[active=true]:data-[state=open]:hover:text-sidebar-active-foreground',
  'data-[active=true]:font-medium',
].join(' ');

/**
 * Brand bar on the left edge of an active top-level button. The tinted fill
 * alone is a 10% wash in light mode and barely separates from the sidebar.
 * Sub-items draw theirs on the submenu rail instead (`ACTIVE_SUB_ITEM_RAIL_CLASS`).
 */
export const ACTIVE_MENU_BAR_CLASS = [
  'relative',
  'data-[active=true]:before:absolute',
  'data-[active=true]:before:inset-y-1.5',
  'data-[active=true]:before:left-0',
  'data-[active=true]:before:w-0.5',
  'data-[active=true]:before:bg-sidebar-primary',
].join(' ');

/** On the sub-item `<li>`: the sub-button clips overflow, and the rail is the `<ul>`'s border 11px to the left. */
export const ACTIVE_SUB_ITEM_RAIL_CLASS =
  'before:absolute before:inset-y-1 before:-left-[11px] before:w-0.5 before:bg-sidebar-primary';

export function buildMenuSections(menus: IGRPMenuItemArgs[]): Section[] {
  const byPosition = (a: IGRPMenuItemArgs, b: IGRPMenuItemArgs) =>
    (a.position ?? 0) - (b.position ?? 0);

  // Codes come from EVERY item: a child of an inactive parent must not be
  // mistaken for an orphan and promoted to the top level.
  const byCode = new Map(menus.map((m) => [m.code, m]));
  const hasParent = (item: IGRPMenuItemArgs) =>
    !!item.parentCode && item.parentCode !== item.code && byCode.has(item.parentCode);

  /** ACTIVE, and so is every ancestor present in the data (an inactive folder hides its subtree). */
  const isVisible = (item: IGRPMenuItemArgs, seen = new Set<string>()): boolean => {
    if (item.status !== 'ACTIVE') return false;
    if (!hasParent(item) || seen.has(item.code)) return true;
    seen.add(item.code);
    return isVisible(byCode.get(item.parentCode!)!, seen);
  };

  const active = menus.filter((m) => isVisible(m)).sort(byPosition);
  if (active.length === 0) return [];

  const topLevel: IGRPMenuItemArgs[] = [];
  const childrenMap = new Map<string, IGRPMenuItemArgs[]>();

  for (const item of active) {
    if (!hasParent(item)) {
      topLevel.push(item);
    } else {
      const list = childrenMap.get(item.parentCode!) ?? [];
      list.push(item);
      childrenMap.set(item.parentCode!, list);
    }
  }

  const isContainer = (item: IGRPMenuItemArgs) => item.type === 'FOLDER' || item.type === 'GROUP';

  /**
   * Every descendant leaf of `code`, in document order.
   *
   * The sidebar renders exactly two levels (folder → sub-item), because that is
   * what `SidebarMenuSub` and the icon-mode dropdown express. A menu tree deeper
   * than that used to be typed as `LeafNode` and rendered as a leaf, which
   * silently dropped its entire subtree from both the sidebar and the search
   * index. Hoisting the descendants keeps every reachable route reachable; only
   * the intermediate grouping is flattened away.
   *
   * `seen` guards a `parentCode` cycle. A cycle among top-level candidates still
   * makes every member non-top-level and therefore unrendered — bad data, but
   * bounded and silent rather than a hang.
   */
  const collectLeaves = (code: string, seen: Set<string>): LeafNode[] => {
    if (seen.has(code)) return [];
    seen.add(code);
    return (childrenMap.get(code) ?? []).flatMap((child): LeafNode[] =>
      isContainer(child) ? collectLeaves(child.code, seen) : [{ kind: 'leaf', item: child }],
    );
  };

  const toNode = (item: IGRPMenuItemArgs): TreeNode => {
    // A GROUP nested below the top level renders like a FOLDER; as a leaf its subtree vanished.
    if (isContainer(item)) {
      return { kind: 'folder', item, children: collectLeaves(item.code, new Set()) };
    }
    return { kind: 'leaf', item };
  };

  const sections: Section[] = [];
  let unlabeled: Section | null = null;

  for (const item of topLevel) {
    if (item.type === 'GROUP') {
      unlabeled = null;
      sections.push({
        key: item.code,
        label: item.name,
        nodes: (childrenMap.get(item.code) ?? []).map(toNode),
      });
    } else {
      if (!unlabeled) {
        unlabeled = { key: `root-${sections.length}`, nodes: [] };
        sections.push(unlabeled);
      }
      unlabeled.nodes.push(toNode(item));
    }
  }

  return sections;
}

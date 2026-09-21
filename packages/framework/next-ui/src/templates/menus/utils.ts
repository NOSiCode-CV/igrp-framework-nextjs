import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { igrpNormalizeUrl } from '@igrp/igrp-framework-react-design-system';

export type LeafNode = { kind: 'leaf'; item: IGRPMenuItemArgs };
export type FolderNode = { kind: 'folder'; item: IGRPMenuItemArgs; children: LeafNode[] };
export type TreeNode = LeafNode | FolderNode;
export type Section = { key: string; label?: string; nodes: TreeNode[] };

export function resolveHref(item: IGRPMenuItemArgs): string {
  if (item.pageSlug) {
    return item.pageSlug.startsWith('/') ? item.pageSlug : `/${item.pageSlug}`;
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
function isAbsoluteUrl(url: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url);
}

export function resolveAnchorTag(item: IGRPMenuItemArgs): boolean {
  const isExternal = !item.pageSlug && !!item.url && isAbsoluteUrl(item.url);
  return isExternal || item.target === '_blank';
}

/**
 * Active-state match for a menu item against the current pathname.
 * Uses prefix matching: an item is active on its own route and any child route.
 *
 * NOTE: callers pass the value of next/navigation `usePathname()`, which is the
 * route SOURCE path. `basePath` is handled (Next strips it), but apps that add
 * `next.config` rewrites/Proxy may see a mismatch between this and the browser
 * URL. If that ever applies, migrate the sidebar to `useSelectedLayoutSegments()`
 * (router-state based, rewrite-immune) — the same hook breadcrumbs.tsx already uses.
 */
export function isItemActive(item: IGRPMenuItemArgs, pathname: string): boolean {
  const href = resolveHref(item);
  if (resolveAnchorTag(item) || href === '#') return false;
  return pathname === href || pathname.startsWith(href + '/');
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
].join(' ');

export function buildMenuSections(menus: IGRPMenuItemArgs[]): Section[] {
  const byPosition = (a: IGRPMenuItemArgs, b: IGRPMenuItemArgs) =>
    (a.position ?? 0) - (b.position ?? 0);

  const active = menus.filter((m) => m.status === 'ACTIVE').sort(byPosition);
  if (active.length === 0) return [];

  const codeSet = new Set(active.map((m) => m.code).filter(Boolean));
  const topLevel: IGRPMenuItemArgs[] = [];
  const childrenMap = new Map<string, IGRPMenuItemArgs[]>();

  for (const item of active) {
    const isTopLevel =
      !item.parentCode || item.parentCode === item.code || !codeSet.has(item.parentCode);
    if (isTopLevel) {
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
    if (item.type === 'FOLDER') {
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

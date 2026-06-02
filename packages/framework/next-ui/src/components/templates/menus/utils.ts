import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { igrpIsExternalUrl, igrpNormalizeUrl } from '@igrp/igrp-framework-react-design-system';

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

export function resolveAnchorTag(item: IGRPMenuItemArgs): boolean {
  const isExternal = !item.pageSlug && !!item.url && igrpIsExternalUrl(item.url);
  return isExternal || item.target === '_blank';
}

export function isItemActive(item: IGRPMenuItemArgs, pathname: string): boolean {
  const href = resolveHref(item);
  if (resolveAnchorTag(item) || href === '#') return false;
  return pathname === href || pathname.startsWith(href + '/');
}

/**
 * Selected-item treatment: a soft brand tint (`sidebar-primary/10`), clearly
 * distinct from the faint `sidebar-accent` hover wash without the weight of a
 * solid fill. Semantic tokens only. Applied via className so it overrides the DS
 * primitive's lighter `data-[active=true]:bg-sidebar-accent` default
 * (tailwind-merge keeps the last).
 *
 * The hover overrides keep the active styling on mouseover. The `data-[state=open]`
 * compound variant is required for FOLDER triggers: the DS primitive ships
 * `data-[state=open]:hover:bg-sidebar-accent`, which has the same specificity as a
 * plain `data-[active=true]:hover:` rule and would otherwise win and drop the
 * highlight when hovering an open, active folder. The extra attribute raises
 * specificity so the active treatment holds.
 */
export const ACTIVE_MENU_ITEM_CLASS = [
  'data-[active=true]:bg-sidebar-primary/10',
  'data-[active=true]:text-sidebar-accent-foreground',
  'data-[active=true]:hover:bg-sidebar-primary/15',
  'data-[active=true]:hover:text-sidebar-accent-foreground',
  'data-[active=true]:data-[state=open]:hover:bg-sidebar-primary/15',
  'data-[active=true]:data-[state=open]:hover:text-sidebar-accent-foreground',
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

  const toNode = (item: IGRPMenuItemArgs): TreeNode => {
    if (item.type === 'FOLDER') {
      const children = (childrenMap.get(item.code) ?? []).map(
        (child): LeafNode => ({ kind: 'leaf', item: child }),
      );
      return { kind: 'folder', item, children };
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

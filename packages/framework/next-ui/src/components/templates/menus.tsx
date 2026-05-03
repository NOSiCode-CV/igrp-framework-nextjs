'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  Alert,
  AlertDescription,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  igrpIsExternalUrl,
  igrpNormalizeUrl,
} from '@igrp/igrp-framework-react-design-system';

// ─── Private tree types ───────────────────────────────────────────────────────

type LeafNode   = { kind: 'leaf';   item: IGRPMenuItemArgs }
type FolderNode = { kind: 'folder'; item: IGRPMenuItemArgs; children: LeafNode[] }
type TreeNode   = LeafNode | FolderNode
type Section    = { key: string; label?: string; nodes: TreeNode[] }

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function resolveHref(item: IGRPMenuItemArgs): string {
  if (item.pageSlug) {
    return item.pageSlug.startsWith('/') ? item.pageSlug : `/${item.pageSlug}`;
  }
  if (item.url) return igrpNormalizeUrl(item.url);
  return '#';
}

function resolveAnchorTag(item: IGRPMenuItemArgs): boolean {
  const isExternal = !item.pageSlug && !!item.url && igrpIsExternalUrl(item.url);
  return isExternal || item.target === '_blank';
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildMenuSections(menus: IGRPMenuItemArgs[]): Section[] {
  const byPosition = (a: IGRPMenuItemArgs, b: IGRPMenuItemArgs) =>
    (a.position ?? 0) - (b.position ?? 0);

  const active = menus.filter((m) => m.status === 'ACTIVE').sort(byPosition);
  if (active.length === 0) return [];

  const codeSet = new Set(active.map((m) => m.code).filter(Boolean));
  const topLevel: IGRPMenuItemArgs[] = [];
  const childrenMap = new Map<string, IGRPMenuItemArgs[]>();

  for (const item of active) {
    const isTopLevel =
      !item.parentCode ||
      item.parentCode === item.code ||
      !codeSet.has(item.parentCode);

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

// ─── LeafMenuItem ─────────────────────────────────────────────────────────────

interface LeafMenuItemProps {
  node: LeafNode;
  pathname: string;
}

function LeafMenuItem({ node, pathname }: LeafMenuItemProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);
  const isActive =
    !isAnchor &&
    href !== '#' &&
    (pathname === href || pathname.startsWith(href + '/'));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
        {isAnchor ? (
          <a
            href={href}
            target={item.target ?? '_blank'}
            rel="noopener noreferrer"
            aria-label={item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name}
          >
            {item.icon && <IGRPIcon iconName={item.icon} />}
            <span>{item.name}</span>
          </a>
        ) : (
          <Link href={href} aria-label={item.name}>
            {item.icon && <IGRPIcon iconName={item.icon} />}
            <span>{item.name}</span>
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ─── SubLeafLink ──────────────────────────────────────────────────────────────

interface SubLeafLinkProps {
  node: LeafNode;
  variant: 'dropdown' | 'collapsible';
}

function SubLeafLink({ node, variant }: SubLeafLinkProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);

  const inner = isAnchor ? (
    <a
      href={href}
      target={item.target ?? '_blank'}
      rel="noopener noreferrer"
      aria-label={item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('h-4 w-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </a>
  ) : (
    <Link
      href={href}
      aria-label={item.name}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('h-4 w-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </Link>
  );

  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem
        asChild
        onSelect={(e) => e.preventDefault()}
        className={cn('cursor-pointer px-2 py-2.5')}
      >
        {inner}
      </DropdownMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>{inner}</SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

// ─── Root component (stub) ────────────────────────────────────────────────────

type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

export function IGRPTemplateMenus(_props: IGRPTemplateMenuArgs) {
  return null;
}

export type { IGRPTemplateMenuArgs };

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

// ─── Stub (replaced in later tasks) ──────────────────────────────────────────

type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

export function IGRPTemplateMenus(_props: IGRPTemplateMenuArgs) {
  return null;
}

export type { IGRPTemplateMenuArgs };

'use client';

import {
  cn,
  IGRPIcon,
  DropdownMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@igrp/igrp-framework-react-design-system';

import type { LeafNode } from './utils.js';
import { resolveHref, resolveAnchorTag, isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils.js';
import { menuLinkAriaLabel, type IGRPMenuLabels } from './labels.js';
import { MenuItemLink } from './menu-item-link.js';

interface SubLeafLinkProps {
  node: LeafNode;
  variant: 'dropdown' | 'collapsible';
  pathname: string;
  labels: IGRPMenuLabels;
}

export function SubLeafLink({ node, variant, pathname, labels }: SubLeafLinkProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);
  const isActive = isItemActive(item, pathname);

  const inner = (
    <MenuItemLink
      href={href}
      isAnchor={isAnchor}
      isActive={isActive}
      target={item.target}
      aria-label={menuLinkAriaLabel(item.name, item.target, labels)}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('size-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </MenuItemLink>
  );

  if (variant === 'dropdown') {
    return (
      // NO `onSelect={(e) => e.preventDefault()}` here. It was suppressing
      // Radix's close-on-select, which left the icon-mode dropdown hanging open
      // over the page the user had just navigated to. Radix closes AFTER the
      // item's own click handling, so `next/link` still navigates.
      <DropdownMenuItem
        asChild
        className={cn(
          'cursor-pointer px-2 py-2.5',
          isActive &&
            'bg-sidebar-active text-sidebar-active-foreground focus:bg-sidebar-active focus:text-sidebar-active-foreground',
        )}
      >
        {inner}
      </DropdownMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive} className={ACTIVE_MENU_ITEM_CLASS}>
        {inner}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

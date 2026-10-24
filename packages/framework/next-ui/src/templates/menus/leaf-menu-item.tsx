'use client';

import {
  cn,
  IGRPIcon,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@igrp/igrp-framework-react-design-system';

import type { LeafNode } from './utils.js';
import {
  resolveHref,
  resolveAnchorTag,
  isItemActive,
  ACTIVE_MENU_ITEM_CLASS,
  ACTIVE_MENU_BAR_CLASS,
} from './utils.js';
import { menuLinkAriaLabel, type IGRPMenuLabels } from './labels.js';
import { MenuItemLink } from './menu-item-link.js';

interface LeafMenuItemProps {
  node: LeafNode;
  pathname: string;
  labels: IGRPMenuLabels;
}

export function LeafMenuItem({ node, pathname, labels }: LeafMenuItemProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);
  const isActive = isItemActive(item, pathname);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.name}
        isActive={isActive}
        className={cn(ACTIVE_MENU_ITEM_CLASS, ACTIVE_MENU_BAR_CLASS)}
      >
        <MenuItemLink
          href={href}
          isAnchor={isAnchor}
          isActive={isActive}
          target={item.target}
          aria-label={menuLinkAriaLabel(item.name, item.target, labels)}
        >
          {item.icon && <IGRPIcon iconName={item.icon} />}
          {/* Explicit: the new-tab arrow can follow it, so the button's `span:last-child` truncate may miss. */}
          <span className={cn('truncate')}>{item.name}</span>
        </MenuItemLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

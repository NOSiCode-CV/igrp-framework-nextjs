'use client';

import {
  IGRPIcon,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@igrp/igrp-framework-react-design-system';

import type { LeafNode } from './utils.js';
import { resolveHref, resolveAnchorTag, isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils.js';
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
        className={ACTIVE_MENU_ITEM_CLASS}
      >
        <MenuItemLink
          href={href}
          isAnchor={isAnchor}
          isActive={isActive}
          target={item.target}
          aria-label={menuLinkAriaLabel(item.name, item.target, labels)}
        >
          {item.icon && <IGRPIcon iconName={item.icon} />}
          <span>{item.name}</span>
        </MenuItemLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

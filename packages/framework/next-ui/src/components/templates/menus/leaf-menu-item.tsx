'use client';

import {
  IGRPIcon,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@igrp/igrp-framework-react-design-system';

import type { LeafNode } from './utils';
import { resolveHref, resolveAnchorTag, isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils';
import { MenuItemLink } from './menu-item-link';

interface LeafMenuItemProps {
  node: LeafNode;
  pathname: string;
}

export function LeafMenuItem({ node, pathname }: LeafMenuItemProps) {
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
          aria-label={item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name}
        >
          {item.icon && <IGRPIcon iconName={item.icon} />}
          <span>{item.name}</span>
        </MenuItemLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

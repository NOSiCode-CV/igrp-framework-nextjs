'use client';

import Link from 'next/link';
import {
  cn,
  IGRPIcon,
  DropdownMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@igrp/igrp-framework-react-design-system';

import type { LeafNode } from './utils';
import { resolveHref, resolveAnchorTag, isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils';

interface SubLeafLinkProps {
  node: LeafNode;
  variant: 'dropdown' | 'collapsible';
  pathname: string;
}

export function SubLeafLink({ node, variant, pathname }: SubLeafLinkProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);
  const isActive = isItemActive(item, pathname);

  const inner = isAnchor ? (
    <a
      href={href}
      target={item.target ?? '_blank'}
      rel="noopener noreferrer"
      aria-label={item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name}
      aria-current={isActive ? 'page' : undefined}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('size-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </a>
  ) : (
    <Link
      href={href}
      aria-label={item.name}
      aria-current={isActive ? 'page' : undefined}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('size-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </Link>
  );

  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem
        asChild
        onSelect={(e) => e.preventDefault()}
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

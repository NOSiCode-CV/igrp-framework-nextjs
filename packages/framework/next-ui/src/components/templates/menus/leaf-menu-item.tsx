'use client';

import Link from 'next/link';
import {
  IGRPIcon,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@igrp/igrp-framework-react-design-system';

import type { LeafNode } from './utils';
import { resolveHref, resolveAnchorTag } from './utils';

interface LeafMenuItemProps {
  node: LeafNode;
  pathname: string;
}

export function LeafMenuItem({ node, pathname }: LeafMenuItemProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);
  const isActive =
    !isAnchor && href !== '#' && (pathname === href || pathname.startsWith(href + '/'));

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

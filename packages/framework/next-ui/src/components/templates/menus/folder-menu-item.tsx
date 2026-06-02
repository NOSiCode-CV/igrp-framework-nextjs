'use client';

import {
  cn,
  IGRPIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@igrp/igrp-framework-react-design-system';

import type { FolderNode } from './utils';
import { isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils';
import { SubLeafLink } from './sub-leaf-link';

interface FolderMenuItemProps {
  node: FolderNode;
  pathname: string;
}

export function FolderMenuItem({ node, pathname }: FolderMenuItemProps) {
  const { item, children } = node;
  const hasActiveChild = children.some((child) => isItemActive(child.item, pathname));

  return (
    <>
      {/* Dropdown — visible only in collapsed (icon) sidebar mode */}
      <SidebarMenuItem className={cn('group')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={item.name}
              isActive={hasActiveChild}
              className={cn(
                'hidden cursor-pointer group-data-[collapsible=icon]:flex',
                ACTIVE_MENU_ITEM_CLASS,
              )}
              aria-label={`${item.name} menu`}
            >
              {item.icon && <IGRPIcon iconName={item.icon} />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className={cn('min-w-48')}>
            {children.map((child) => (
              <SubLeafLink
                key={`dd-${child.item.id}`}
                node={child}
                variant="dropdown"
                pathname={pathname}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Collapsible — visible only in expanded sidebar mode */}
      <SidebarMenuItem>
        <Collapsible defaultOpen={hasActiveChild} className={cn('w-full group/collapsible')}>
          <CollapsibleTrigger
            className={cn('flex w-full group-data-[collapsible=icon]:hidden')}
            asChild
          >
            <SidebarMenuButton
              tooltip={item.name}
              isActive={hasActiveChild}
              className={cn('w-full cursor-pointer', ACTIVE_MENU_ITEM_CLASS)}
              aria-label={`Toggle ${item.name} submenu`}
            >
              {item.icon && <IGRPIcon iconName={item.icon} />}
              <span>{item.name}</span>
              <IGRPIcon
                iconName="ChevronRight"
                className={cn(
                  'ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                )}
                strokeWidth={2}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {children.map((child) => (
                <SubLeafLink
                  key={`col-${child.item.id}`}
                  node={child}
                  variant="collapsible"
                  pathname={pathname}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </>
  );
}

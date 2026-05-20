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
import { SubLeafLink } from './sub-leaf-link';

interface FolderMenuItemProps {
  node: FolderNode;
}

export function FolderMenuItem({ node }: FolderMenuItemProps) {
  const { item, children } = node;

  return (
    <>
      {/* Dropdown — visible only in collapsed (icon) sidebar mode */}
      <SidebarMenuItem className={cn('group')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={item.name}
              className={cn('hidden cursor-pointer group-data-[collapsible=icon]:flex')}
              aria-label={`${item.name} menu`}
            >
              {item.icon && <IGRPIcon iconName={item.icon} />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className={cn('min-w-48')}>
            {children.map((child) => (
              <SubLeafLink key={`dd-${child.item.id}`} node={child} variant="dropdown" />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Collapsible — visible only in expanded sidebar mode */}
      <SidebarMenuItem>
        <Collapsible className={cn('w-full group/collapsible')}>
          <CollapsibleTrigger
            className={cn('flex w-full group-data-[collapsible=icon]:hidden')}
            asChild
          >
            <SidebarMenuButton
              tooltip={item.name}
              className={cn('w-full cursor-pointer')}
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
                <SubLeafLink key={`col-${child.item.id}`} node={child} variant="collapsible" />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    </>
  );
}

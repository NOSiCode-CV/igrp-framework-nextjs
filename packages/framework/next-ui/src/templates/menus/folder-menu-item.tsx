'use client';

import { useEffect, useState } from 'react';
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

import type { FolderNode } from './utils.js';
import { isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils.js';
import { formatMenuLabel, type IGRPMenuLabels } from './labels.js';
import { SubLeafLink } from './sub-leaf-link.js';

interface FolderMenuItemProps {
  node: FolderNode;
  pathname: string;
  labels: IGRPMenuLabels;
}

export function FolderMenuItem({ node, pathname, labels }: FolderMenuItemProps) {
  const { item, children } = node;
  const hasActiveChild = children.some((child) => isItemActive(child.item, pathname));

  // CONTROLLED, not `defaultOpen`. The sidebar is a persistent shell, so a
  // folder mounts once for the whole session; `defaultOpen` is read on that one
  // mount and never again. Navigating from a leaf in folder A to a leaf in
  // folder B therefore left B collapsed while its trigger showed the active
  // highlight. Opening on the `hasActiveChild` EDGE (rather than binding
  // `open` to it outright) auto-reveals the route the user just landed on
  // without fighting a manual collapse of some other folder.
  const [open, setOpen] = useState(hasActiveChild);
  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    // ONE list item for both surfaces. They were two, and the icon-mode one hid
    // only its button — leaving an empty <li> in the <ul> for every folder in
    // expanded mode.
    <SidebarMenuItem>
      {/* Dropdown — visible only in collapsed (icon) sidebar mode */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.name}
            isActive={hasActiveChild}
            className={cn(
              'hidden cursor-pointer group-data-[collapsible=icon]:flex',
              ACTIVE_MENU_ITEM_CLASS,
            )}
            aria-label={formatMenuLabel(labels.folderMenu, { name: item.name })}
          >
            {item.icon && <IGRPIcon iconName={item.icon} />}
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className={cn('min-w-48')}>
          {children.map((child) => (
            <SubLeafLink
              key={`dd-${child.item.id ?? child.item.code}`}
              node={child}
              variant="dropdown"
              pathname={pathname}
              labels={labels}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Collapsible — visible only in expanded sidebar mode */}
      <Collapsible open={open} onOpenChange={setOpen} className={cn('w-full group/collapsible')}>
        <CollapsibleTrigger
          className={cn('flex w-full group-data-[collapsible=icon]:hidden')}
          asChild
        >
          <SidebarMenuButton
            tooltip={item.name}
            isActive={hasActiveChild}
            className={cn('w-full cursor-pointer', ACTIVE_MENU_ITEM_CLASS)}
            aria-label={formatMenuLabel(labels.toggleSubmenu, { name: item.name })}
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
                key={`col-${child.item.id ?? child.item.code}`}
                node={child}
                variant="collapsible"
                pathname={pathname}
                labels={labels}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

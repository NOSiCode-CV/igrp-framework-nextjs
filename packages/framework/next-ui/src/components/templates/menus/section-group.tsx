'use client';

import {
  cn,
  IGRPIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from '@igrp/igrp-framework-react-design-system';

import type { Section } from './utils';
import { FolderMenuItem } from './folder-menu-item';
import { LeafMenuItem } from './leaf-menu-item';

interface SectionGroupProps {
  section: Section;
  pathname: string;
}

export function SectionGroup({ section, pathname }: SectionGroupProps) {
  const menuContent = (
    <SidebarGroupContent>
      <SidebarMenu role="navigation">
        {section.nodes.map((node) =>
          node.kind === 'folder' ? (
            <FolderMenuItem key={`folder-${node.item.id}`} node={node} pathname={pathname} />
          ) : (
            <LeafMenuItem key={`leaf-${node.item.id}`} node={node} pathname={pathname} />
          ),
        )}
      </SidebarMenu>
    </SidebarGroupContent>
  );

  if (section.label) {
    return (
      <SidebarGroup>
        <Collapsible defaultOpen className={cn('group/collapsible-group')}>
          <CollapsibleTrigger
            className={cn(
              'flex h-8 w-full cursor-pointer items-center rounded-md px-2',
              'text-xs font-medium text-sidebar-foreground/70',
              'transition-colors hover:text-sidebar-foreground',
              'group-data-[collapsible=icon]:hidden',
            )}
          >
            {section.label}
            <IGRPIcon
              iconName="ChevronRight"
              className={cn(
                'ml-auto size-3.5 shrink-0 transition-transform duration-200',
                'group-data-[state=open]/collapsible-group:rotate-90',
              )}
              strokeWidth={2}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>{menuContent}</CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  }

  return <SidebarGroup>{menuContent}</SidebarGroup>;
}

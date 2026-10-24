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

import type { Section } from './utils.js';
import type { IGRPMenuLabels } from './labels.js';
import { FolderMenuItem } from './folder-menu-item.js';
import { LeafMenuItem } from './leaf-menu-item.js';

interface SectionGroupProps {
  section: Section;
  pathname: string;
  labels: IGRPMenuLabels;
}

export function SectionGroup({ section, pathname, labels }: SectionGroupProps) {
  const menuContent = (
    <SidebarGroupContent>
      <SidebarMenu>
        {section.nodes.map((node) =>
          node.kind === 'folder' ? (
            <FolderMenuItem
              key={`folder-${node.item.id ?? node.item.code}`}
              node={node}
              pathname={pathname}
              labels={labels}
            />
          ) : (
            <LeafMenuItem
              key={`leaf-${node.item.id ?? node.item.code}`}
              node={node}
              pathname={pathname}
              labels={labels}
            />
          ),
        )}
      </SidebarMenu>
    </SidebarGroupContent>
  );

  if (section.label) {
    return (
      <SidebarGroup>
        <Collapsible defaultOpen className="group/collapsible-group">
          <CollapsibleTrigger
            className={cn(
              'group/section-trigger flex h-8 w-full cursor-pointer items-center rounded-md px-2',
              'text-xs font-medium text-sidebar-foreground/70',
              'transition-colors hover:text-sidebar-foreground',
              'group-data-[collapsible=icon]:hidden',
            )}
          >
            {section.label}
            <IGRPIcon
              iconName="ChevronRight"
              className={cn(
                'ml-auto size-3.5 shrink-0 transition-[transform,opacity] duration-200',
                'group-data-[state=open]/collapsible-group:rotate-90',
                // An always-on chevron made section labels read as folders. Shown on
                // hover/focus, and always while collapsed so the hidden items stay discoverable.
                'opacity-0 group-hover/section-trigger:opacity-100 group-focus-visible/section-trigger:opacity-100',
                'group-data-[state=closed]/collapsible-group:opacity-100',
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

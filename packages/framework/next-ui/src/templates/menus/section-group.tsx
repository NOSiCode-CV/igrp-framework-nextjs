'use client';

import { useState } from 'react';
import {
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useIGRPSidebar,
} from '@igrp/igrp-framework-react-design-system';
import { ChevronRightIcon } from 'lucide-react';

import { activeHrefWithin, type Section } from './utils.js';
import type { IGRPMenuLabels } from './labels.js';
import { FolderMenuItem } from './folder-menu-item.js';
import { LeafMenuItem } from './leaf-menu-item.js';

interface SectionGroupProps {
  section: Section;
  activeHref: string | null;
  labels: IGRPMenuLabels;
}

export function SectionGroup({ section, activeHref, labels }: SectionGroupProps) {
  const [open, setOpen] = useState(true);
  const { state, isMobile } = useIGRPSidebar();
  // Icon mode hides the trigger, so a collapsed section would have no way back; show its items there.
  // Not via CSS: Tailwind v4 preflight's `[hidden] { display: none !important }` beats any utility.
  const iconMode = state === 'collapsed' && !isMobile;
  const menuContent = (
    <SidebarGroupContent>
      <SidebarMenu>
        {section.nodes.map((node) =>
          node.kind === 'folder' ? (
            <FolderMenuItem
              key={`folder-${node.item.id ?? node.item.code}`}
              node={node}
              activeHref={activeHrefWithin(node, activeHref)}
              labels={labels}
            />
          ) : (
            <LeafMenuItem
              key={`leaf-${node.item.id ?? node.item.code}`}
              node={node}
              activeHref={activeHrefWithin(node, activeHref)}
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
        <Collapsible
          open={open || iconMode}
          onOpenChange={setOpen}
          className="group/collapsible-group"
        >
          <CollapsibleTrigger
            className={cn(
              'group/section-trigger flex h-8 w-full cursor-pointer items-center rounded-md px-2',
              'text-xs font-medium text-sidebar-foreground/70',
              'transition-colors hover:text-sidebar-foreground',
              'group-data-[collapsible=icon]:hidden',
            )}
          >
            {section.label}
            <ChevronRightIcon
              size={16}
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

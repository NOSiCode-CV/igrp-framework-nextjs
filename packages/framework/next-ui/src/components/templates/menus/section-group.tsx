'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  return (
    <SidebarGroup>
      {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu role="navigation">
          {section.nodes.map((node) =>
            node.kind === 'folder' ? (
              <FolderMenuItem key={`folder-${node.item.id}`} node={node} />
            ) : (
              <LeafMenuItem key={`leaf-${node.item.id}`} node={node} pathname={pathname} />
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

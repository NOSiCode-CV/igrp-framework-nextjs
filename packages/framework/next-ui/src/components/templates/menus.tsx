'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  igrpIsExternalUrl,
  igrpNormalizeUrl,
} from '@igrp/igrp-framework-react-design-system';

// ─── Private tree types ───────────────────────────────────────────────────────

type LeafNode   = { kind: 'leaf';   item: IGRPMenuItemArgs }
type FolderNode = { kind: 'folder'; item: IGRPMenuItemArgs; children: LeafNode[] }
type TreeNode   = LeafNode | FolderNode
type Section    = { key: string; label?: string; nodes: TreeNode[] }

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function resolveHref(item: IGRPMenuItemArgs): string {
  if (item.pageSlug) {
    return item.pageSlug.startsWith('/') ? item.pageSlug : `/${item.pageSlug}`;
  }
  if (item.url) return igrpNormalizeUrl(item.url);
  return '#';
}

function resolveAnchorTag(item: IGRPMenuItemArgs): boolean {
  const isExternal = !item.pageSlug && !!item.url && igrpIsExternalUrl(item.url);
  return isExternal || item.target === '_blank';
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildMenuSections(menus: IGRPMenuItemArgs[]): Section[] {
  const byPosition = (a: IGRPMenuItemArgs, b: IGRPMenuItemArgs) =>
    (a.position ?? 0) - (b.position ?? 0);

  const active = menus.filter((m) => m.status === 'ACTIVE').sort(byPosition);
  if (active.length === 0) return [];

  const codeSet = new Set(active.map((m) => m.code).filter(Boolean));
  const topLevel: IGRPMenuItemArgs[] = [];
  const childrenMap = new Map<string, IGRPMenuItemArgs[]>();

  for (const item of active) {
    const isTopLevel =
      !item.parentCode ||
      item.parentCode === item.code ||
      !codeSet.has(item.parentCode);

    if (isTopLevel) {
      topLevel.push(item);
    } else {
      const list = childrenMap.get(item.parentCode!) ?? [];
      list.push(item);
      childrenMap.set(item.parentCode!, list);
    }
  }

  const toNode = (item: IGRPMenuItemArgs): TreeNode => {
    if (item.type === 'FOLDER') {
      const children = (childrenMap.get(item.code) ?? []).map(
        (child): LeafNode => ({ kind: 'leaf', item: child }),
      );
      return { kind: 'folder', item, children };
    }
    return { kind: 'leaf', item };
  };

  const sections: Section[] = [];
  let unlabeled: Section | null = null;

  for (const item of topLevel) {
    if (item.type === 'GROUP') {
      unlabeled = null;
      sections.push({
        key: item.code,
        label: item.name,
        nodes: (childrenMap.get(item.code) ?? []).map(toNode),
      });
    } else {
      if (!unlabeled) {
        unlabeled = { key: `root-${sections.length}`, nodes: [] };
        sections.push(unlabeled);
      }
      unlabeled.nodes.push(toNode(item));
    }
  }

  return sections;
}

// ─── LeafMenuItem ─────────────────────────────────────────────────────────────

interface LeafMenuItemProps {
  node: LeafNode;
  pathname: string;
}

function LeafMenuItem({ node, pathname }: LeafMenuItemProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);
  const isActive =
    !isAnchor &&
    href !== '#' &&
    (pathname === href || pathname.startsWith(href + '/'));

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

// ─── SubLeafLink ──────────────────────────────────────────────────────────────

interface SubLeafLinkProps {
  node: LeafNode;
  variant: 'dropdown' | 'collapsible';
}

function SubLeafLink({ node, variant }: SubLeafLinkProps) {
  const { item } = node;
  const href = resolveHref(item);
  const isAnchor = resolveAnchorTag(item);

  const inner = isAnchor ? (
    <a
      href={href}
      target={item.target ?? '_blank'}
      rel="noopener noreferrer"
      aria-label={item.target === '_blank' ? `${item.name} (opens in new tab)` : item.name}
      className={cn('flex items-center gap-2 w-full min-w-0')}
    >
      {item.icon && <IGRPIcon iconName={item.icon} className={cn('size-4 shrink-0')} />}
      <span className={cn('truncate')}>{item.name}</span>
    </a>
  ) : (
    <Link
      href={href}
      aria-label={item.name}
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
        className={cn('cursor-pointer px-2 py-2.5')}
      >
        {inner}
      </DropdownMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>{inner}</SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

// ─── FolderMenuItem ───────────────────────────────────────────────────────────

interface FolderMenuItemProps {
  node: FolderNode;
}

function FolderMenuItem({ node }: FolderMenuItemProps) {
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

// ─── SectionGroup ─────────────────────────────────────────────────────────────

interface SectionGroupProps {
  section: Section;
  pathname: string;
}

function SectionGroup({ section, pathname }: SectionGroupProps) {
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

// ─── IGRPTemplateMenus (public) ───────────────────────────────────────────────

type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

export function IGRPTemplateMenus({ menus = [] }: IGRPTemplateMenuArgs) {
  const pathname = usePathname();
  const sections = useMemo(() => buildMenuSections(menus), [menus]);

  if (sections.length === 0) {
    return (
      <SidebarGroup>
        <div
          className={cn(
            'flex items-center gap-3 rounded-md border border-dashed px-3 py-3',
            'text-muted-foreground',
            'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2',
          )}
          title="Aplicação sem menus"
        >
          <IGRPIcon iconName="GlobeX" className={cn('size-4 shrink-0')} />
          <span className={cn('text-xs group-data-[collapsible=icon]:hidden')}>
            Aplicação sem menus.
          </span>
        </div>
      </SidebarGroup>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <SectionGroup key={`grp-${section.key}`} section={section} pathname={pathname} />
      ))}
    </>
  );
}

export type { IGRPTemplateMenuArgs };

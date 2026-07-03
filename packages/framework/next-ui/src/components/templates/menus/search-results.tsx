'use client';

import { useMemo } from 'react';
import {
  cn,
  IGRPIcon,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@igrp/igrp-framework-react-design-system';

import type { Section } from './utils';
import { resolveHref, resolveAnchorTag, isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils';
import { MenuItemLink } from './menu-item-link';

interface SearchResult {
  id: string | number | undefined;
  name: string;
  icon?: string;
  /** Label parts shown as "Grupo A › Documentos" — does NOT include the item name itself. */
  breadcrumb: string[];
  href: string;
  isAnchor: boolean;
  target?: string;
  isActive: boolean;
}

/** Wraps the substring of `text` that matches `query` in a `<mark>` so the reason a result surfaced is visible. */
function HighlightedName({ text, query }: { text: string; query: string }) {
  const start = text.toLowerCase().indexOf(query.toLowerCase());
  if (start === -1) return <>{text}</>;
  const end = start + query.length;

  return (
    <>
      {text.slice(0, start)}
      <mark className={cn('rounded-sm bg-primary/20 text-inherit')}>{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

function buildResults(sections: Section[], query: string, pathname: string): SearchResult[] {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const section of sections) {
    const sectionCrumb = section.label ? [section.label] : [];

    for (const node of section.nodes) {
      if (node.kind === 'leaf') {
        if (node.item.name.toLowerCase().includes(q)) {
          results.push({
            id: node.item.id,
            name: node.item.name,
            icon: node.item.icon,
            breadcrumb: sectionCrumb,
            href: resolveHref(node.item),
            isAnchor: resolveAnchorTag(node.item),
            target: node.item.target,
            isActive: isItemActive(node.item, pathname),
          });
        }
      } else {
        for (const child of node.children) {
          if (child.item.name.toLowerCase().includes(q)) {
            results.push({
              id: child.item.id,
              name: child.item.name,
              icon: child.item.icon,
              breadcrumb: [...sectionCrumb, node.item.name],
              href: resolveHref(child.item),
              isAnchor: resolveAnchorTag(child.item),
              target: child.item.target,
              isActive: isItemActive(child.item, pathname),
            });
          }
        }
      }
    }
  }

  return results;
}

interface SearchResultsProps {
  sections: Section[];
  query: string;
  pathname: string;
}

export function SearchResults({ sections, query, pathname }: SearchResultsProps) {
  const results = useMemo(
    () => buildResults(sections, query, pathname),
    [sections, query, pathname],
  );

  if (results.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div
            className={cn(
              'flex flex-col items-center gap-2 rounded-md border border-dashed px-3 py-6 text-center',
              'text-muted-foreground',
            )}
          >
            <IGRPIcon iconName="SearchX" className={cn('size-5 shrink-0')} />
            <p className={cn('text-xs')}>
              Sem resultados para{' '}
              <span className={cn('font-medium text-foreground')}>"{query}"</span>.
            </p>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <p className={cn('px-2 pb-1 text-xs font-medium text-sidebar-foreground/70')}>
          {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
        </p>
        <SidebarMenu>
          {results.map((result) => {
            const inner = (
              <MenuItemLink
                href={result.href}
                isAnchor={result.isAnchor}
                isActive={result.isActive}
                target={result.target}
                aria-label={
                  result.isAnchor && result.target === '_blank'
                    ? `${result.name} (opens in new tab)`
                    : undefined
                }
                className={cn('flex items-center gap-2')}
              >
                {result.icon && (
                  <IGRPIcon iconName={result.icon} className={cn('size-4 shrink-0')} />
                )}
                <span className={cn('flex min-w-0 flex-col items-start')}>
                  <span className={cn('truncate')}>
                    <HighlightedName text={result.name} query={query} />
                  </span>
                  {result.breadcrumb.length > 0 && (
                    <span className={cn('truncate text-xs text-muted-foreground')}>
                      {result.breadcrumb.join(' › ')}
                    </span>
                  )}
                </span>
              </MenuItemLink>
            );

            return (
              <SidebarMenuItem
                key={
                  result.id != null
                    ? String(result.id)
                    : `${result.breadcrumb.join('/')}/${result.name}`
                }
              >
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={result.isActive}
                  className={ACTIVE_MENU_ITEM_CLASS}
                >
                  {inner}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

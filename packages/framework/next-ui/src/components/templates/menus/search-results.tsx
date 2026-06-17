'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  cn,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@igrp/igrp-framework-react-design-system';

import type { Section } from './utils';
import { resolveHref, resolveAnchorTag, isItemActive, ACTIVE_MENU_ITEM_CLASS } from './utils';

interface SearchResult {
  id: string | number | undefined;
  name: string;
  /** Label parts shown as "Grupo A › Documentos" — does NOT include the item name itself. */
  breadcrumb: string[];
  href: string;
  isAnchor: boolean;
  target?: string;
  isActive: boolean;
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
          <p className={cn('px-2 py-3 text-xs text-muted-foreground')}>Sem resultados.</p>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {results.map((result) => {
            const inner = result.isAnchor ? (
              <a
                href={result.href}
                target={result.target ?? '_blank'}
                rel="noopener noreferrer"
                aria-label={
                  result.target === '_blank' ? `${result.name} (opens in new tab)` : undefined
                }
                aria-current={result.isActive ? 'page' : undefined}
                className={cn('flex flex-col items-start gap-0.5')}
              >
                <span className={cn('truncate')}>{result.name}</span>
                {result.breadcrumb.length > 0 && (
                  <span className={cn('truncate text-xs text-muted-foreground')}>
                    {result.breadcrumb.join(' › ')}
                  </span>
                )}
              </a>
            ) : (
              <Link
                href={result.href}
                aria-current={result.isActive ? 'page' : undefined}
                className={cn('flex flex-col items-start gap-0.5')}
              >
                <span className={cn('truncate')}>{result.name}</span>
                {result.breadcrumb.length > 0 && (
                  <span className={cn('truncate text-xs text-muted-foreground')}>
                    {result.breadcrumb.join(' › ')}
                  </span>
                )}
              </Link>
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

'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  cn,
  Input,
  SidebarGroup,
  SidebarGroupContent,
} from '@igrp/igrp-framework-react-design-system';
import { GlobeXIcon, SearchIcon, XIcon } from 'lucide-react';

import { activeHrefWithin, buildMenuSections, findActiveHref } from './utils.js';
import { useIGRPChromeI18n } from '../../i18n/context.js';
import { resolveMenuLabels, type IGRPMenuLabels } from './labels.js';
import { SectionGroup } from './section-group.js';
import { buildResults, SearchResults, searchResultsSummary } from './search-results.js';

export type IGRPTemplateMenuArgs = {
  menus?: IGRPMenuItemArgs[];
  showSearch?: boolean;
  /**
   * @deprecated Pass `labels={{ navAriaLabel }}` instead. Still honoured, and
   * still wins over `labels.navAriaLabel`, for one release.
   */
  navAriaLabel?: string;
  /** Partial override of the chrome catalog group. Missing keys keep the catalog value. */
  labels?: Partial<IGRPMenuLabels>;
  /** Controlled search query. Omit to let the menu own it. */
  query?: string;
  /** Called with every query change (typing, clear), controlled or not. */
  onQueryChange?: (query: string) => void;
};

export function IGRPTemplateMenus({
  menus = [],
  showSearch = false,
  navAriaLabel,
  labels: labelOverrides,
  query: controlledQuery,
  onQueryChange,
}: IGRPTemplateMenuArgs) {
  const pathname = usePathname();
  const [internalQuery, setInternalQuery] = useState('');
  const query = controlledQuery ?? internalQuery;
  const sections = useMemo(() => buildMenuSections(menus), [menus]);
  const activeHref = useMemo(() => findActiveHref(sections, pathname), [sections, pathname]);
  const chrome = useIGRPChromeI18n();
  const labels = useMemo(
    () => ({
      ...resolveMenuLabels(labelOverrides, chrome.menus),
      ...(navAriaLabel ? { navAriaLabel } : null),
    }),
    [labelOverrides, navAriaLabel, chrome.menus],
  );

  // Keyed off the menu CONTENT, not the array identity. `[menus]` cleared what
  // the user was typing on every render in which the caller rebuilt the array
  // — which is every render for anyone passing an inline literal, the shape the
  // default parameter itself produces. A controlled query is the caller's to
  // reset: notifying it here would set parent state during render.
  const menuKey = useMemo(() => menus.map((m) => m.code).join('|'), [menus]);
  const [queryMenuKey, setQueryMenuKey] = useState(menuKey);
  if (menuKey !== queryMenuKey) {
    setQueryMenuKey(menuKey);
    setInternalQuery('');
  }

  const setQuery = useCallback(
    (next: string) => {
      setInternalQuery(next);
      onQueryChange?.(next);
    },
    [onQueryChange],
  );

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    [setQuery],
  );

  const handleClearQuery = useCallback(() => setQuery(''), [setQuery]);

  // Typing stays responsive on large menus: results re-filter at lower priority.
  const deferredQuery = useDeferredValue(query.trim());
  const results = useMemo(
    () => (showSearch && deferredQuery ? buildResults(sections, deferredQuery, activeHref) : null),
    [showSearch, deferredQuery, sections, activeHref],
  );

  if (sections.length === 0) {
    return (
      <SidebarGroup>
        <div
          className={cn(
            'flex items-center gap-3 rounded-md border border-dashed px-3 py-3',
            'text-muted-foreground',
            'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2',
          )}
          title={labels.emptyMenus}
        >
          <GlobeXIcon size={16} className={cn('size-4 shrink-0')} />
          <span className={cn('text-xs group-data-[collapsible=icon]:hidden')}>
            {labels.emptyMenus}
          </span>
        </div>
      </SidebarGroup>
    );
  }

  const trimmedQuery = query.trim();

  return (
    <nav aria-label={labels.navAriaLabel}>
      {showSearch && (
        <SidebarGroup className={cn('group-data-[collapsible=icon]:hidden')}>
          <SidebarGroupContent>
            <div className={cn('relative')}>
              <SearchIcon
                size={16}
                className={cn(
                  'pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground',
                )}
              />
              <Input
                type="search"
                aria-label={labels.searchAriaLabel}
                placeholder={labels.searchPlaceholder}
                value={query}
                onChange={handleQueryChange}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className={cn('h-8 pl-8 text-xs', trimmedQuery && 'pr-7')}
              />
              {trimmedQuery && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  aria-label={labels.clearSearch}
                  className={cn(
                    'absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm',
                    'text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <XIcon size={16} className={cn('size-3.5')} />
                </button>
              )}
            </div>
            {/* Always mounted, so screen readers announce each new summary. */}
            <p role="status" className={cn('sr-only')}>
              {results ? searchResultsSummary(results, deferredQuery, labels) : ''}
            </p>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {results ? (
        <SearchResults results={results} query={deferredQuery} labels={labels} />
      ) : (
        sections.map((section) => (
          <SectionGroup
            key={`grp-${section.key}`}
            section={section}
            activeHref={
              section.nodes.some((node) => activeHrefWithin(node, activeHref)) ? activeHref : null
            }
            labels={labels}
          />
        ))
      )}
    </nav>
  );
}

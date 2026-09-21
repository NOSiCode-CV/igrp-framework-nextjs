'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  Input,
  SidebarGroup,
  SidebarGroupContent,
} from '@igrp/igrp-framework-react-design-system';

import { buildMenuSections } from './utils.js';
import { resolveMenuLabels, type IGRPMenuLabels } from './labels.js';
import { SectionGroup } from './section-group.js';
import { SearchResults } from './search-results.js';

export type IGRPTemplateMenuArgs = {
  menus?: IGRPMenuItemArgs[];
  showSearch?: boolean;
  /**
   * @deprecated Pass `labels={{ navAriaLabel }}` instead. Still honoured, and
   * still wins over `labels.navAriaLabel`, for one release.
   */
  navAriaLabel?: string;
  /** Partial override of the pt-PT strings. Missing keys keep their default. */
  labels?: Partial<IGRPMenuLabels>;
};

export function IGRPTemplateMenus({
  menus = [],
  showSearch = false,
  navAriaLabel,
  labels: labelOverrides,
}: IGRPTemplateMenuArgs) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const sections = useMemo(() => buildMenuSections(menus), [menus]);
  const labels = useMemo(
    () => ({
      ...resolveMenuLabels(labelOverrides),
      ...(navAriaLabel ? { navAriaLabel } : null),
    }),
    [labelOverrides, navAriaLabel],
  );

  // Keyed off the menu CONTENT, not the array identity. `[menus]` cleared what
  // the user was typing on every render in which the caller rebuilt the array
  // — which is every render for anyone passing an inline literal, the shape the
  // default parameter itself produces.
  const menuKey = useMemo(() => menus.map((m) => m.code).join('|'), [menus]);
  useEffect(() => {
    setQuery('');
  }, [menuKey]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    [],
  );

  const handleClearQuery = useCallback(() => setQuery(''), []);

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
          <IGRPIcon iconName="GlobeX" className={cn('size-4 shrink-0')} />
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
              <IGRPIcon
                iconName="Search"
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
                  <IGRPIcon iconName="X" className={cn('size-3.5')} />
                </button>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {showSearch && trimmedQuery ? (
        <SearchResults
          sections={sections}
          query={trimmedQuery}
          pathname={pathname}
          labels={labels}
        />
      ) : (
        sections.map((section) => (
          <SectionGroup
            key={`grp-${section.key}`}
            section={section}
            pathname={pathname}
            labels={labels}
          />
        ))
      )}
    </nav>
  );
}

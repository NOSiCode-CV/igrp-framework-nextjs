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

import { buildMenuSections } from './utils';
import { SectionGroup } from './section-group';
import { SearchResults } from './search-results';

export type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[]; showSearch?: boolean };

export function IGRPTemplateMenus({ menus = [], showSearch = false }: IGRPTemplateMenuArgs) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const sections = useMemo(() => buildMenuSections(menus), [menus]);

  useEffect(() => {
    setQuery('');
  }, [menus]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    [],
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

  const trimmedQuery = query.trim();

  return (
    <>
      {showSearch && (
        <SidebarGroup className={cn('group-data-[collapsible=icon]:hidden')}>
          <SidebarGroupContent>
            <div className={cn('relative')}>
              <IGRPIcon
                iconName="Search"
                className={cn(
                  'absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground',
                )}
              />
              <Input
                type="search"
                aria-label="Pesquisar menus"
                placeholder="Pesquisar menus..."
                value={query}
                onChange={handleQueryChange}
                className={cn('h-8 pl-8 text-xs')}
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {showSearch && trimmedQuery ? (
        <SearchResults sections={sections} query={trimmedQuery} pathname={pathname} />
      ) : (
        sections.map((section) => (
          <SectionGroup key={`grp-${section.key}`} section={section} pathname={pathname} />
        ))
      )}
    </>
  );
}

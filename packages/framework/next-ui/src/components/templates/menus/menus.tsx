'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { cn, IGRPIcon, SidebarGroup } from '@igrp/igrp-framework-react-design-system';

import { buildMenuSections } from './utils';
import { SectionGroup } from './section-group';

export type IGRPTemplateMenuArgs = { menus?: IGRPMenuItemArgs[] };

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

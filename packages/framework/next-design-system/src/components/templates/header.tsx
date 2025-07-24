import type { IGRPHeaderDataArgs } from '@igrp/framework-next-types';

import { Separator } from '../primitives/separator';
import { SidebarTrigger } from '../horizon/sidebar';
import { IGRPTemplateBreadcrumbs } from './breadcrumbs';
import { IGRPTemplateCommandSearch } from './command-search';
import { IGRPTemplateModeSwitcher } from './mode-switcher';
import { IGRPTemplateNavUserHeader } from './nav-user-header';
import { IGRPTemplateNotifications } from './notifications';
import { cn } from '../../lib/utils';

interface IGRPTemplateHeaderProps {
  data?: IGRPHeaderDataArgs;
  className?: string;
}

function IGRPTemplateHeader({ data, className }: IGRPTemplateHeaderProps) {
  if (!data) return null;

  const { user, showBreadcrumbs, showSearch, showNotifications, showThemeSwitcher, showUser } =
    data;

  return (
    <header
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-10 border-b flex items-center justify-between gap-2 px-4 py-2',
        className,
      )}
    >
      <div className="flex items-center gap-2 h-12">
        <SidebarTrigger />
        {showBreadcrumbs && (
          <>
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <IGRPTemplateBreadcrumbs />
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showSearch && <IGRPTemplateCommandSearch />}

        {showNotifications && (
          <span className="hidden md:block">
            <IGRPTemplateNotifications />
          </span>
        )}

        {showThemeSwitcher && <IGRPTemplateModeSwitcher />}

        {showUser && <IGRPTemplateNavUserHeader user={user} />}
      </div>
    </header>
  );
}

export { IGRPTemplateHeader };

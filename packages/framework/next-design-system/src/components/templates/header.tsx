import type { IGRPHeaderDataArgs } from '@igrp/framework-next-types';

import { Separator } from '../primitives/separator';
import { SidebarTrigger } from '../horizon/sidebar';
import { IGRPBreadcrumbs } from './breadcrumbs';
import { IGRPCommandSearch } from './command-search';
import { IGRPModeSwitcher } from './mode-switcher';
import { IGRPNavUserHeader } from './nav-user-header';
import { Notifications } from './notifications';
import { cn } from '../../lib/utils';

interface IGRPHeaderProps {
  data?: IGRPHeaderDataArgs;
  className?: string;
}

export function IGRPHeader({ data, className }: IGRPHeaderProps) {
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
            <IGRPBreadcrumbs />
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showSearch && <IGRPCommandSearch />}

        {showNotifications && (
          <span className="hidden md:block">
            <Notifications />
          </span>
        )}

        {showThemeSwitcher && <IGRPModeSwitcher />}

        {showUser && <IGRPNavUserHeader user={user} />}
      </div>
    </header>
  );
}

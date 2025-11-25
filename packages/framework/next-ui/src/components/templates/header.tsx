'use client';

import type { IGRPHeaderDataArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPSeparatorPrimitive,
  IGRPSidebarTriggerPrimitive,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

import { IGRPTemplateBreadcrumbs } from './breadcrumbs';
import { IGRPTemplateCommandSearch } from './command-search';
import { IGRPTemplateModeSwitcher } from './mode-switcher';
import { IGRPTemplateNavUser } from './nav-user';
import { IGRPTemplateNotifications } from './notifications';

interface IGRPTemplateHeaderProps {
  data: IGRPHeaderDataArgs;
  className?: string;
}

function IGRPTemplateHeader({ data, className }: IGRPTemplateHeaderProps) {
  const { igrpToast } = useIGRPToast();

  if (!data) {
    console.info(
      '[header-template] Cabeçalho do IGRP não tem dados, define os dados no src/igrp.template.config.',
    );
    igrpToast({
      type: 'info',
      description:
        '[header-template] Cabeçalho do IGRP não tem dados, define os dados no src/igrp.template.config.',
      duration: 10000,
    });
    return null;
  }

  const { user, showBreadcrumb, showSearch, showNotifications, showThemeSwitcher, showUser } = data;

  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0',
        className,
      )}
    >
      <div className="flex items-center gap-2 h-12 min-w-0">
        <IGRPSidebarTriggerPrimitive />
        {showBreadcrumb && (
          <>
            <IGRPSeparatorPrimitive
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <IGRPTemplateBreadcrumbs />
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {showSearch && <IGRPTemplateCommandSearch />}

        {showNotifications && (
          <span className="hidden md:block">
            <IGRPTemplateNotifications />
          </span>
        )}

        {showThemeSwitcher && <IGRPTemplateModeSwitcher />}

        {showUser && <IGRPTemplateNavUser user={user} isHeader={true} />}
      </div>
    </div>
  );
}

export { IGRPTemplateHeader };

'use client';

import type { IGRPHeaderDataArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  IGRPSeparatorPrimitive,
  IGRPSidebarTriggerPrimitive,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

import { IGRPTemplateBreadcrumbs } from './breadcrumbs';
import { IGRPTemplateCommandSearch } from './command-search';
import { IGRPTemplateModeSwitcher } from './mode-switcher';
import { IGRPTemplateNavUser } from './nav-user';
import { IGRPTemplateNotifications } from './notifications';
import Image from 'next/image';
import Link from 'next/link';

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

  const {
    user,
    showBreadcrumb,
    showSearch,
    showNotifications,
    showThemeSwitcher,
    showUser,
    showIGRPSidebarTrigger,
    showIGRPHeaderLogo,
    showIGRPHeaderTitle,
    headerLogo,
    showSettings,
    settingsUrl,
    settingsIcon,
  } = data;

  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0',
        className,
      )}
    >
      <div className="flex items-center gap-2 h-12 min-w-0">
        {showIGRPSidebarTrigger && <IGRPSidebarTriggerPrimitive />}
        {!showIGRPSidebarTrigger && (
          <div className="flex items-center gap-2">
            {showIGRPHeaderLogo && (
              <div className="h-10 w-10 relative rounded-lg flex items-center justify-center">
                <Image
                  src={headerLogo || '/logo-no-text.png'}
                  alt="IGRP Logo"
                  fill
                  className="object-contain"
                  quality={100}
                  sizes="46px"
                  priority
                />
              </div>
            )}
            {showIGRPHeaderTitle && <span className="text-base font-semibold">iGRP</span>}
          </div>
        )}

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
      <div className="flex items-center gap-2 shrink-0">
        {showSearch && <IGRPTemplateCommandSearch />}

        {showSettings && (
          <Link href={settingsUrl || '/settings'}>
            <IGRPIcon iconName={settingsIcon ?? 'Settings'} />
          </Link>
        )}

        {showNotifications && (
          <span className="hidden md:block">
            <IGRPTemplateNotifications notifications={[]} />
          </span>
        )}

        {showThemeSwitcher && <IGRPTemplateModeSwitcher />}

        {showUser && <IGRPTemplateNavUser user={user} isHeader={true} />}
      </div>
    </div>
  );
}

export { IGRPTemplateHeader };

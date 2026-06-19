'use client';

import type { IGRPHeaderDataArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  Separator,
  SidebarTrigger,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

import { type BreadcrumbItem, IGRPTemplateBreadcrumbs } from './breadcrumbs';
import { IGRPTemplateCommandSearch } from './command-search';
import { IGRPTemplateModeSwitcher } from './mode-switcher';
import { IGRPTemplateNavUser } from './nav-user';
import { IGRPTemplateNotifications } from './notifications';
import Image from 'next/image';
import Link from 'next/link';

interface IGRPTemplateHeaderProps {
  data: IGRPHeaderDataArgs;
  className?: string;
  /** Pre-resolved breadcrumb items. Forwarded to IGRPTemplateBreadcrumbs. */
  breadcrumbs?: BreadcrumbItem[];
  /** App-level route → label map. Forwarded to IGRPTemplateBreadcrumbs. */
  breadcrumbRouteLabels?: Record<string, string>;
}

function IGRPTemplateHeader({
  data,
  className,
  breadcrumbs,
  breadcrumbRouteLabels,
}: IGRPTemplateHeaderProps) {
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
    return;
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
    userProfileUrl,
    notificationsUrl,
    notifications,
  } = data;

  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0',
        className,
      )}
    >
      <div className="flex items-center gap-2 h-12 min-w-0">
        {showIGRPSidebarTrigger && <SidebarTrigger />}
        {(showIGRPHeaderLogo || showIGRPHeaderTitle) && (
          <div className="flex items-center gap-2">
            {showIGRPHeaderLogo && (
              <div className="size-10 rounded-lg overflow-hidden flex items-center justify-center">
                <Image
                  src={headerLogo || `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo-no-text.png`}
                  alt="IGRP"
                  width={40}
                  height={40}
                  className="object-contain size-10"
                  priority
                />
              </div>
            )}
            {showIGRPHeaderTitle && <span className="text-base font-semibold">iGRP</span>}
          </div>
        )}

        {showBreadcrumb && (
          <>
            <Separator
              orientation="vertical"
              className={cn('mr-2 data-[orientation=vertical]:h-4')}
            />
            <IGRPTemplateBreadcrumbs items={breadcrumbs} routeLabels={breadcrumbRouteLabels} />
          </>
        )}
      </div>
      <div className={cn('flex items-center gap-2 shrink-0')}>
        {showSearch && <IGRPTemplateCommandSearch />}

        {showSettings && (
          <Link href={settingsUrl || '/settings'}>
            <IGRPIcon iconName={settingsIcon ?? 'Settings'} />
          </Link>
        )}

        {showNotifications && (
          <span className={cn('hidden md:block')}>
            <IGRPTemplateNotifications
              notifications={notifications || []}
              notificationsUrl={notificationsUrl}
            />
          </span>
        )}

        {showThemeSwitcher && <IGRPTemplateModeSwitcher />}

        {showUser && (
          <IGRPTemplateNavUser
            user={user}
            isHeader={true}
            userProfileUrl={userProfileUrl}
            notificationsUrl={notificationsUrl}
            showNotifications={showNotifications}
          />
        )}
      </div>
    </div>
  );
}

export { IGRPTemplateHeader };

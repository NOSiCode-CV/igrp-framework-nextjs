'use client';

import {
  cn,
  IGRPIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useIGRPSidebar,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPApplicationArgs } from '@igrp/framework-next-types';
import { useMemo } from 'react';

import { getLocationOriginURL } from '../lib/utils.js';
import { IGRPTemplateImage } from './template-image.js';

interface IGRPTemplateAppSwitcherProps {
  apps?: IGRPApplicationArgs[];
  appCode?: string;
  appCenterUrl?: string;
  /** Label of the Applications Center entry. pt-PT default. */
  appCenterLabel?: string;
  /** Shown in place of a missing application name. */
  unknownLabel?: string;
}

function IGRPTemplateAppSwitcher({
  apps,
  appCode,
  appCenterUrl,
  appCenterLabel = 'Centro de Aplicações',
  unknownLabel = 'N/D',
}: IGRPTemplateAppSwitcherProps) {
  // The Horizon alias of the same hook the rest of this package uses. Both names
  // resolve to one context (`horizon/sidebar` re-exports `useSidebar`), so this
  // is consistency, not a fix.
  const { isMobile } = useIGRPSidebar();

  const activeApp = useMemo(() => {
    if (!apps || apps.length === 0) return undefined;
    return appCode ? apps.find((item) => item.code === appCode) : apps[0];
  }, [apps, appCode]);

  const listApps = useMemo(() => {
    if (!apps || !activeApp) return [];
    return apps.filter((item) => item.id !== activeApp.id);
  }, [apps, activeApp]);

  const getAppUrl = (app: IGRPApplicationArgs): string => {
    if (app.url) return app.url;

    const _url = getLocationOriginURL();

    if (app.slug) return app.slug.startsWith('/') ? `${_url}${app.slug}` : `${_url}/${app.slug}`;

    return _url;
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {activeApp ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                )}
              >
                <div
                  className={cn('flex aspect-square size-8 items-center justify-center rounded-lg')}
                >
                  <IGRPTemplateImage
                    src={activeApp.picture}
                    alt={activeApp.name}
                    width={32}
                    height={32}
                    className={cn('h-full w-full rounded-lg object-cover')}
                    priority
                    fallback={<IGRPIcon iconName="GalleryVerticalEnd" />}
                  />
                </div>
                <div className={cn('grid flex-1 text-left text-sm leading-tight')}>
                  <span className={cn('truncate font-medium')}>{activeApp.name}</span>
                  <span className={cn('truncate text-xs')}>{activeApp.description || ''}</span>
                </div>
                <IGRPIcon iconName="ChevronsUpDown" className={cn('ml-auto')} />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn('min-w-56 rounded-lg')}
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              {listApps.length > 0 &&
                listApps.map((app) => (
                  <DropdownMenuItem key={app.code} className={cn('gap-2 p-2')} asChild>
                    <a href={getAppUrl(app)}>
                      <div
                        className={cn('flex size-6 items-center justify-center rounded-md border')}
                      >
                        <IGRPTemplateImage
                          src={app.picture}
                          alt={app.name}
                          width={24}
                          height={24}
                          className={cn('h-full w-full rounded-md object-cover')}
                          priority
                          fallback={
                            <IGRPIcon
                              iconName="AudioWaveform"
                              className={cn('size-3.5 shrink-0')}
                            />
                          }
                        />
                      </div>
                      {app.name}
                    </a>
                  </DropdownMenuItem>
                ))}

              {/* `> 1` here hid the Applications Center from every two-app
                  tenant. The entry is about leaving for the catalogue, so the
                  only precondition is having a URL for it. */}
              {appCenterUrl && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className={cn('gap-2 p-2')} asChild>
                    <a href={appCenterUrl}>
                      <div
                        className={cn(
                          'flex size-6 items-center justify-center rounded-md border bg-transparent',
                        )}
                      >
                        <IGRPIcon iconName="CornerDownLeft" className={cn('size-3 shrink-0')} />
                      </div>
                      <div className={cn('text-muted-foreground font-medium')}>
                        {appCenterLabel}
                      </div>
                    </a>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton
            size="lg"
            disabled
            className={cn(
              'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
            )}
          >
            <div className={cn('flex aspect-square size-8 items-center justify-center rounded-lg')}>
              <IGRPIcon iconName="Command" />
            </div>
            <div className={cn('grid flex-1 text-left text-sm leading-tight')}>
              <span className={cn('truncate font-medium')}>{unknownLabel}</span>
              <span className={cn('truncate text-xs')}>{unknownLabel}</span>
            </div>
            <IGRPIcon iconName="ChevronsUpDown" className={cn('ml-auto')} />
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export { IGRPTemplateAppSwitcher, type IGRPTemplateAppSwitcherProps };

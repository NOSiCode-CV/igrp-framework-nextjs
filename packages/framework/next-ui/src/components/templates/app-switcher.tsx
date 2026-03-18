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
  useSidebar,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPApplicationArgs } from '@igrp/framework-next-types';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

import { getLocationOriginURL } from '../../lib/utils';

interface IGRPTemplateAppSwitcherProps {
  apps?: IGRPApplicationArgs[];
  appCode?: string;
  appCenterUrl?: string;
  baseUrl?: string;
}

function IGRPTemplateAppSwitcher({ apps, appCode, appCenterUrl }: IGRPTemplateAppSwitcherProps) {
  const { isMobile } = useSidebar();

  const currentApp = useMemo(() => {
    if (!apps || apps.length === 0) return undefined;
    return appCode ? apps.find((item) => item.code === appCode) : apps[0];
  }, [apps, appCode]);

  const [activeApp, setActiveApp] = useState<IGRPApplicationArgs | undefined>(currentApp);
  const [listApps, setListApps] = useState<IGRPApplicationArgs[]>(() => {
    if (!apps || !currentApp) return [];
    return apps.filter((item) => item.id !== currentApp.id);
  });

  useEffect(() => {
    if (currentApp) {
      setActiveApp(currentApp);
      if (apps) {
        setListApps(apps.filter((item) => item.id !== currentApp.id));
      }
    }
  }, [currentApp, apps]);

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
                  {activeApp.picture ? (
                    <Image
                      src={activeApp.picture}
                      alt={activeApp.name}
                      width={32}
                      height={32}
                      className={cn('h-full w-full rounded-lg object-cover')}
                      priority
                    />
                  ) : (
                    <IGRPIcon iconName="GalleryVerticalEnd" />
                  )}
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
                        {app.picture ? (
                          <Image
                            src={app.picture}
                            alt={app.name}
                            width={24}
                            height={24}
                            className={cn('h-full w-full rounded-md object-cover')}
                            priority
                          />
                        ) : (
                          <IGRPIcon iconName="AudioWaveform" className={cn('size-3.5 shrink-0')} />
                        )}
                      </div>
                      {app.name}
                    </a>
                  </DropdownMenuItem>
                ))}

              {appCenterUrl && (listApps?.length ?? 0) > 1 && (
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
                        Applications Center
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
              <span className={cn('truncate font-medium')}>N/A</span>
              <span className={cn('truncate text-xs')}>N/A</span>
            </div>
            <IGRPIcon iconName="ChevronsUpDown" className={cn('ml-auto')} />
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export { IGRPTemplateAppSwitcher, type IGRPTemplateAppSwitcherProps };

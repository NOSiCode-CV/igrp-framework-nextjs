'use client';

import {
  IGRPIcon,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPSidebarMenuPrimitive,
  IGRPSidebarMenuButtonPrimitive,
  IGRPSidebarMenuItemPrimitive,
  useIGRPSidebarPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPApplicationArgs } from '@igrp/framework-next-types';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface IGRPTemplateAppSwitcherProps {
  apps?: IGRPApplicationArgs[];
  appCode?: string;
  appCenterUrl?: string;
  baseUrl?: string;
}

function IGRPTemplateAppSwitcher({ apps, appCode, appCenterUrl }: IGRPTemplateAppSwitcherProps) {
  const { isMobile } = useIGRPSidebarPrimitive();

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

  const _url = typeof window !== 'undefined' ? window.location.origin : '';
  console.log('WINDOW ORIGIN ::: ', _url);

  const getAppUrl = (app: IGRPApplicationArgs): string => {
    if (app.url) {
      console.log('APP URL ::: ', app.url);
      return app.url;
    }

    if (app.slug) {
      console.log('APP SLUG ::: ', app.slug);
      return app.slug.startsWith('/') ? `${_url}${app.slug}` : `${_url}/${app.slug}`;
    }

    return _url;
  };

  return (
    <IGRPSidebarMenuPrimitive>
      <IGRPSidebarMenuItemPrimitive>
        {activeApp ? (
          <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
              <IGRPSidebarMenuButtonPrimitive
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  {activeApp.picture ? (
                    <Image
                      src={activeApp.picture}
                      alt={activeApp.name}
                      width={32}
                      height={32}
                      className="h-full w-full rounded-lg object-cover"
                      priority
                    />
                  ) : (
                    <IGRPIcon iconName="GalleryVerticalEnd" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeApp.name}</span>
                  <span className="truncate text-xs">{activeApp.description || ''}</span>
                </div>
                <IGRPIcon iconName="ChevronsUpDown" className="ml-auto" />
              </IGRPSidebarMenuButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>
            <IGRPDropdownMenuContentPrimitive
              className="min-w-56 rounded-lg"
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              {listApps.length > 0 &&
                listApps.map((app) => (
                  <IGRPDropdownMenuItemPrimitive key={app.code} className="gap-2 p-2" asChild>
                    <a href={getAppUrl(app)}>
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        {app.picture ? (
                          <Image
                            src={app.picture}
                            alt={app.name}
                            width={24}
                            height={24}
                            className="h-full w-full rounded-md object-cover"
                            priority
                          />
                        ) : (
                          <IGRPIcon iconName="AudioWaveform" className="size-3.5 shrink-0" />
                        )}
                      </div>
                      {app.name}
                    </a>
                  </IGRPDropdownMenuItemPrimitive>
                ))}

              {appCenterUrl && (listApps?.length ?? 0) > 1 && (
                <>
                  <IGRPDropdownMenuSeparatorPrimitive />
                  <IGRPDropdownMenuItemPrimitive className="gap-2 p-2" asChild>
                    <a href={appCenterUrl}>
                      <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                        <IGRPIcon iconName="CornerDownLeft" className="size-3 shrink-0" />
                      </div>
                      <div className="text-muted-foreground font-medium">Applications Center</div>
                    </a>
                  </IGRPDropdownMenuItemPrimitive>
                </>
              )}
            </IGRPDropdownMenuContentPrimitive>
          </IGRPDropdownMenuPrimitive>
        ) : (
          <IGRPSidebarMenuButtonPrimitive
            size="lg"
            disabled
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
              <IGRPIcon iconName="Command" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">N/A</span>
              <span className="truncate text-xs">N/A</span>
            </div>
            <IGRPIcon iconName="ChevronsUpDown" className="ml-auto" />
          </IGRPSidebarMenuButtonPrimitive>
        )}
      </IGRPSidebarMenuItemPrimitive>
    </IGRPSidebarMenuPrimitive>
  );
}

export { IGRPTemplateAppSwitcher, type IGRPTemplateAppSwitcherProps };

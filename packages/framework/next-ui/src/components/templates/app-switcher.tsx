'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  IGRPIcon,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPSidebarMenuPrimitive,
  IGRPSidebarMenuButtonPrimitive,
  IGRPSidebarMenuItemPrimitive,
  useIGRPSidebarPrimitive,
  cn,
} from '@igrp/igrp-framework-react-design-system';
import type { IGRPApplicationArgs } from '@igrp/framework-next-types';
import Link from 'next/link';

interface IGRPTemplateAppSwitcherProps {
  apps?: IGRPApplicationArgs[];
  appCode?: string;
  appCenterUrl?: string;
}

function IGRPTemplateAppSwitcher({ apps, appCode, appCenterUrl }: IGRPTemplateAppSwitcherProps) {
  const { isMobile } = useIGRPSidebarPrimitive();
  const currentApp = appCode ? apps?.find((item) => item.code === appCode) : apps?.[0];
  const [activeApp, setActiveApp] = useState(currentApp);
  const [listApps, setListApps] = useState(apps?.filter((item) => item.id !== activeApp?.id));

  if (!activeApp) throw new Error('Active application not found');

  const getApps = (app: IGRPApplicationArgs) => {
    setActiveApp(app);
    setListApps(apps?.filter((item) => item.id !== app.id));
  };

  return (
    <IGRPSidebarMenuPrimitive>
      <IGRPSidebarMenuItemPrimitive>
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
                    width={16}
                    height={16}
                    className="h-auto w-auto"
                    style={{ height: 'auto', width: 'auto' }}
                    priority
                  />
                ) : (
                  <IGRPIcon iconName="GalleryVerticalEnd" className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeApp.name}</span>
                <span className="truncate text-xs">{activeApp.description}</span>
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
            {listApps && listApps.length > 0 && (
              <>
                <IGRPDropdownMenuLabelPrimitive className="text-muted-foreground text-xs">
                  Apps
                </IGRPDropdownMenuLabelPrimitive>

                {listApps.map((app) => (
                  <IGRPDropdownMenuItemPrimitive
                    key={app.code}
                    onClick={() => getApps(app)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      {app.picture ? (
                        <Image
                          src={app.picture}
                          alt={app.name}
                          width={16}
                          height={16}
                          className="h-auto w-auto"
                          priority
                        />
                      ) : (
                        <IGRPIcon iconName="AudioWaveform" className="size-3.5 shrink-0" />
                      )}
                    </div>
                    {app.name}
                  </IGRPDropdownMenuItemPrimitive>
                ))}
              </>
            )}

            <IGRPDropdownMenuSeparatorPrimitive />
            <IGRPDropdownMenuItemPrimitive 
              className={cn("gap-2 p-2", !appCenterUrl && 'pointer-events-none opacity-50')}
             asChild
            >
            <Link href={appCenterUrl || '#'}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <IGRPIcon iconName="Plus" className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Ir ao Apps Center</div>
            </Link>
              
            </IGRPDropdownMenuItemPrimitive>
          </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
      </IGRPSidebarMenuItemPrimitive>
    </IGRPSidebarMenuPrimitive>
  );
}

export { IGRPTemplateAppSwitcher, type IGRPTemplateAppSwitcherProps };

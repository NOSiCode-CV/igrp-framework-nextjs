'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';

import { 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  useSidebar 
} from '../primitives/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../primitives/dropdown-menu';
import type { IGRPApplicationArgs } from '@/types/globals';

interface AppSwitcherProps {
  apps?: IGRPApplicationArgs[], // TODO: fetching from API
  currentApp?: IGRPApplicationArgs // TODO: fetching from API by appCode
}

// TODO: Add messages 

export function IGRPAppSwitcher({ apps, currentApp }: AppSwitcherProps) {
  const { isMobile } = useSidebar()
  const mockApps = apps
  const [activeTeam, setActiveTeam] = useState(currentApp ?? mockApps?.[0]);

  const appCenterUrl = process.env.IGRP_APP_CENTER_URL || ""

  if (!appCenterUrl) {
    console.warn("::: Missing APP_CENTER_URL :::");
  }

  const openAppCenter = () => {   
    if (appCenterUrl) {
      console.log("Go to App Center")
      window.open(appCenterUrl, "_blank", "noopener,noreferrer")
    }   
  }

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {activeTeam.picture ? (
                  <Image
                    src={activeTeam.picture}
                    alt={activeTeam.name}
                    width={16}
                    height={16}
                    className="h-auto w-auto"
                    style={{ height: "auto", width: "auto" }}
                    priority
                  />
                ) : (
                  <IGRPIcon iconName='GalleryVerticalEnd' className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.description}</span>
              </div>
              <IGRPIcon iconName='ChevronsUpDown' className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Apps
            </DropdownMenuLabel>
            {apps?.map(app => (
              <DropdownMenuItem
                key={app.code}
                onClick={() => setActiveTeam(app)}
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
                    <IGRPIcon iconName='AudioWaveform' className="size-3.5 shrink-0" />
                  )}
                </div>
                {app.name}                
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => openAppCenter()}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <IGRPIcon iconName='Plus' className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Go to App Center</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
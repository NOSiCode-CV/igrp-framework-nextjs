'use client';

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useIGRPSidebar,
} from '@igrp/igrp-framework-react-design-system';
import {
  ArrowRightIcon,
  AudioWaveformIcon,
  ChevronsUpDownIcon,
  CommandIcon,
  CornerDownLeftIcon,
  GalleryVerticalEndIcon,
} from 'lucide-react';
import type { IGRPApplicationArgs } from '@igrp/framework-next-types';
import { useMemo } from 'react';

import { useIGRPChromeI18n } from '../i18n/context.js';
import { getLocationOriginURL } from '../lib/utils.js';
import { IGRPTemplateImage } from './template-image.js';

interface IGRPTemplateAppSwitcherProps {
  apps?: IGRPApplicationArgs[];
  appCode?: string;
  appCenterUrl?: string;
  /** Label of the Applications Center entry.. Defaults to the chrome catalog. */
  appCenterLabel?: string;
  /** Shown in place of a missing application name. */
  unknownLabel?: string;
}

function IGRPTemplateAppSwitcher({
  apps,
  appCode,
  appCenterUrl,
  appCenterLabel,
  unknownLabel,
}: IGRPTemplateAppSwitcherProps) {
  // The Horizon alias of the same hook the rest of this package uses. Both names
  // resolve to one context (`horizon/sidebar` re-exports `useSidebar`), so this
  // is consistency, not a fix.
  const { isMobile } = useIGRPSidebar();
  const chrome = useIGRPChromeI18n();
  const appCenterText = appCenterLabel ?? chrome.appSwitcher.appCenter;
  const unknownText = unknownLabel ?? chrome.appSwitcher.unknown;

  const activeApp = useMemo(() => {
    if (!apps || apps.length === 0) return undefined;
    if (!appCode) return apps[0];
    // `igrpBuildConfig` uppercases `appCode`; the AM may return the code in any case.
    const code = appCode.toUpperCase();
    return apps.find((item) => item.code?.toUpperCase() === code);
  }, [apps, appCode]);

  const listApps = useMemo(() => {
    if (!apps) return [];
    return apps.filter((item) => item !== activeApp);
  }, [apps, activeApp]);

  const getAppUrl = (app: IGRPApplicationArgs): string => {
    if (app.url) return app.url;

    const _url = getLocationOriginURL();

    if (app.slug) return app.slug.startsWith('/') ? `${_url}${app.slug}` : `${_url}/${app.slug}`;

    return _url;
  };

  // Radix focuses an item on pointer-over as well as on keyboard navigation, so
  // keying the arrow on focus too shows it for both.
  const itemClassName = 'cursor-pointer gap-2 p-2';
  const arrowClassName =
    'ml-auto size-4 shrink-0 -translate-x-1 opacity-0 transition-[opacity,translate] group-hover/dropdown-menu-item:translate-x-0 group-hover/dropdown-menu-item:opacity-100 group-focus/dropdown-menu-item:translate-x-0 group-focus/dropdown-menu-item:opacity-100 motion-reduce:transition-none';

  const triggerContent = activeApp ? (
    <>
      <div className={cn('flex aspect-square size-8 items-center justify-center rounded-lg')}>
        <IGRPTemplateImage
          src={activeApp.picture}
          // Decorative: the app name is the visible text beside it.
          alt=""
          width={32}
          height={32}
          className={cn('h-full w-full rounded-lg object-cover')}
          priority
          fallback={<GalleryVerticalEndIcon size={16} />}
        />
      </div>
      <div className={cn('grid flex-1 text-left text-sm leading-tight')}>
        <span className={cn('truncate font-medium')}>{activeApp.name}</span>
        <span className={cn('truncate text-xs')}>{activeApp.description || ''}</span>
      </div>
      <ChevronsUpDownIcon size={16} className={cn('ml-auto')} />
    </>
  ) : (
    <>
      <div className={cn('flex aspect-square size-8 items-center justify-center rounded-lg')}>
        <CommandIcon size={16} />
      </div>
      <div className={cn('grid flex-1 text-left text-sm leading-tight')}>
        <span className={cn('truncate font-medium')}>{unknownText}</span>
        <span className={cn('truncate text-xs')}>{unknownText}</span>
      </div>
      <ChevronsUpDownIcon size={16} className={cn('ml-auto')} />
    </>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* An unknown `appCode` must not lock the user out of the other apps and the app center. */}
        {listApps.length > 0 || appCenterUrl ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={cn(
                  'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                )}
              >
                {triggerContent}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn('min-w-56 rounded-lg')}
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              {listApps.length > 0 && (
                <DropdownMenuGroup>
                  {listApps.map((app) => (
                    <DropdownMenuItem key={app.code} className={cn(itemClassName)} asChild>
                      <a href={getAppUrl(app)}>
                        <div
                          className={cn(
                            'flex size-6 items-center justify-center rounded-md border',
                          )}
                        >
                          <IGRPTemplateImage
                            src={app.picture}
                            alt=""
                            width={24}
                            height={24}
                            className={cn('h-full w-full rounded-md object-cover')}
                            priority
                            fallback={
                              <AudioWaveformIcon size={16} className={cn('size-3.5 shrink-0')} />
                            }
                          />
                        </div>
                        <span className={cn('truncate')}>{app.name}</span>
                        <ArrowRightIcon size={16} className={cn(arrowClassName)} />
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              )}

              {/* `> 1` here hid the Applications Center from every two-app
                  tenant. The entry is about leaving for the catalogue, so the
                  only precondition is having a URL for it. */}
              {appCenterUrl && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className={cn(itemClassName)} asChild>
                      <a href={appCenterUrl}>
                        <div
                          className={cn(
                            'flex size-6 items-center justify-center rounded-md border bg-transparent',
                          )}
                        >
                          <CornerDownLeftIcon size={16} className={cn('size-3 shrink-0')} />
                        </div>
                        <div className={cn('text-muted-foreground font-medium')}>
                          {appCenterText}
                        </div>
                        <ArrowRightIcon size={16} className={cn(arrowClassName)} />
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
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
            {triggerContent}
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export { IGRPTemplateAppSwitcher, type IGRPTemplateAppSwitcherProps };

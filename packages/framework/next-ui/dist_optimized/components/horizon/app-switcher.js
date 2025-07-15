'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import Image from 'next/image';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../primitives/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../primitives/sidebar';
// TODO: Add messages
export function IGRPAppSwitcher(t0) {
  const $ = _c(23);
  const {
    apps,
    appCode,
    appCenterUrl
  } = t0;
  const {
    isMobile
  } = useSidebar();
  let t1;
  if ($[0] !== appCode || $[1] !== apps) {
    t1 = appCode ? apps?.find(item => item.id === appCode) : apps?.[0];
    $[0] = appCode;
    $[1] = apps;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const currentApp = t1;
  const [activeApp, setActiveApp] = useState(currentApp);
  let t2;
  if ($[3] !== activeApp?.id || $[4] !== apps) {
    t2 = apps?.filter(item_0 => item_0.id !== activeApp?.id);
    $[3] = activeApp?.id;
    $[4] = apps;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const [listApps, setListApps] = useState(t2);
  if (!activeApp) {
    throw new Error("Active application not found");
  }
  if (!appCenterUrl) {
    console.warn("::: Missing APP_CENTER_URL :::");
  }
  let t3;
  if ($[6] !== appCenterUrl) {
    t3 = () => {
      if (appCenterUrl) {
        window.open(appCenterUrl, "_self", "noopener,noreferrer");
      }
    };
    $[6] = appCenterUrl;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const openAppCenter = t3;
  let t4;
  if ($[8] !== apps) {
    t4 = app => {
      setActiveApp(app);
      setListApps(apps?.filter(item_1 => item_1.id !== app.id));
    };
    $[8] = apps;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const getApps = t4;
  let t5;
  if ($[10] !== activeApp.description || $[11] !== activeApp.name || $[12] !== activeApp.picture || $[13] !== getApps || $[14] !== isMobile || $[15] !== listApps || $[16] !== openAppCenter) {
    let t6;
    if ($[18] !== getApps || $[19] !== listApps) {
      t6 = listApps && listApps.length > 0 && _jsxs(_Fragment, {
        children: [_jsx(DropdownMenuLabel, {
          className: "text-muted-foreground text-xs",
          children: "Apps"
        }), listApps.map(app_0 => _jsxs(DropdownMenuItem, {
          onClick: () => getApps(app_0),
          className: "gap-2 p-2",
          children: [_jsx("div", {
            className: "flex size-6 items-center justify-center rounded-md border",
            children: app_0.picture ? _jsx(Image, {
              src: app_0.picture,
              alt: app_0.name,
              width: 16,
              height: 16,
              className: "h-auto w-auto",
              priority: true
            }) : _jsx(IGRPIcon, {
              iconName: "AudioWaveform",
              className: "size-3.5 shrink-0"
            })
          }), app_0.name]
        }, app_0.code))]
      });
      $[18] = getApps;
      $[19] = listApps;
      $[20] = t6;
    } else {
      t6 = $[20];
    }
    let t7;
    if ($[21] !== openAppCenter) {
      t7 = () => openAppCenter();
      $[21] = openAppCenter;
      $[22] = t7;
    } else {
      t7 = $[22];
    }
    t5 = _jsx(SidebarMenu, {
      children: _jsx(SidebarMenuItem, {
        children: _jsxs(DropdownMenu, {
          children: [_jsx(DropdownMenuTrigger, {
            asChild: true,
            children: _jsxs(SidebarMenuButton, {
              size: "lg",
              className: "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
              children: [_jsx("div", {
                className: "text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg",
                children: activeApp.picture ? _jsx(Image, {
                  src: activeApp.picture,
                  alt: activeApp.name,
                  width: 16,
                  height: 16,
                  className: "h-auto w-auto",
                  style: {
                    height: "auto",
                    width: "auto"
                  },
                  priority: true
                }) : _jsx(IGRPIcon, {
                  iconName: "GalleryVerticalEnd",
                  className: "size-4"
                })
              }), _jsxs("div", {
                className: "grid flex-1 text-left text-sm leading-tight",
                children: [_jsx("span", {
                  className: "truncate font-medium",
                  children: activeApp.name
                }), _jsx("span", {
                  className: "truncate text-xs",
                  children: activeApp.description
                })]
              }), _jsx(IGRPIcon, {
                iconName: "ChevronsUpDown",
                className: "ml-auto"
              })]
            })
          }), _jsxs(DropdownMenuContent, {
            className: "min-w-56 rounded-lg",
            align: "start",
            side: isMobile ? "bottom" : "right",
            sideOffset: 4,
            children: [t6, _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, {
              className: "gap-2 p-2",
              onClick: t7,
              children: [_jsx("div", {
                className: "flex size-6 items-center justify-center rounded-md border bg-transparent",
                children: _jsx(IGRPIcon, {
                  iconName: "Plus",
                  className: "size-4"
                })
              }), _jsx("div", {
                className: "text-muted-foreground font-medium",
                children: "Go to App Center"
              })]
            })]
          })]
        })
      })
    });
    $[10] = activeApp.description;
    $[11] = activeApp.name;
    $[12] = activeApp.picture;
    $[13] = getApps;
    $[14] = isMobile;
    $[15] = listApps;
    $[16] = openAppCenter;
    $[17] = t5;
  } else {
    t5 = $[17];
  }
  return t5;
}
//# sourceMappingURL=app-switcher.js.map
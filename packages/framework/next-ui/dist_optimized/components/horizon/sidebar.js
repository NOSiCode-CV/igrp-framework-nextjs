'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarRail } from '../primitives/sidebar';
import { IGRPAppSwitcher } from './app-switcher';
import { IGRPMenus } from './menus';
import { IGRPNavUser } from './nav-user';
export function IGRPSidebar(t0) {
  const $ = _c(15);
  let data;
  let props;
  if ($[0] !== t0) {
    ({
      data,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = data;
    $[2] = props;
  } else {
    data = $[1];
    props = $[2];
  }
  if (!data) {
    throw new Error("Sidebar data is required");
  }
  const pathname = usePathname();
  const {
    footerItems,
    menuItems,
    user,
    showAppSwitcher,
    apps,
    appCode,
    appCenterUrl
  } = data;
  let t1;
  if ($[3] !== appCenterUrl || $[4] !== appCode || $[5] !== apps || $[6] !== showAppSwitcher) {
    t1 = showAppSwitcher && _jsx(IGRPAppSwitcher, {
      apps,
      appCode,
      appCenterUrl
    });
    $[3] = appCenterUrl;
    $[4] = appCode;
    $[5] = apps;
    $[6] = showAppSwitcher;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  let t2;
  if ($[8] !== footerItems || $[9] !== menuItems || $[10] !== pathname || $[11] !== props || $[12] !== t1 || $[13] !== user) {
    t2 = _jsxs(Sidebar, {
      collapsible: "icon",
      ...props,
      variant: "sidebar",
      children: [_jsx(SidebarHeader, {
        children: t1
      }), _jsx(SidebarContent, {
        children: _jsxs(SidebarGroup, {
          children: [_jsx(SidebarGroupLabel, {
            children: "Main"
          }), _jsx(SidebarGroupContent, {
            children: _jsx(IGRPMenus, {
              menus: menuItems
            })
          })]
        })
      }), _jsxs(SidebarFooter, {
        children: [_jsx(SidebarMenu, {
          children: footerItems?.map((t3, index) => {
            const {
              name,
              url,
              icon
            } = t3;
            return _jsx(SidebarMenuButton, {
              asChild: true,
              isActive: pathname === url || url !== "/" && pathname?.startsWith(url || ""),
              tooltip: name,
              children: _jsxs(Link, {
                href: url || "",
                children: [icon && _jsx(IGRPIcon, {
                  iconName: icon
                }), _jsx("span", {
                  children: name
                })]
              })
            }, `footer-menu-${index}`);
          })
        }), _jsx(IGRPNavUser, {
          user
        })]
      }), _jsx(SidebarRail, {})]
    });
    $[8] = footerItems;
    $[9] = menuItems;
    $[10] = pathname;
    $[11] = props;
    $[12] = t1;
    $[13] = user;
    $[14] = t2;
  } else {
    t2 = $[14];
  }
  return t2;
}
//# sourceMappingURL=sidebar.js.map
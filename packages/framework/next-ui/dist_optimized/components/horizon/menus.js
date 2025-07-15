'use client';

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import { Alert, AlertDescription } from '../../components/primitives/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/primitives/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/primitives/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '../../components/primitives/sidebar';
import { isExternalUrl, normalizeUrl } from '../../lib/url';
export function IGRPMenus({
  menus = []
}) {
  const pathname = usePathname();
  const menuData = useMemo(() => {
    return menus.length > 0 ? menus : undefined;
  }, [menus]);
  const {
    topLevelMenus,
    childMap
  } = useMemo(() => {
    const topLevel = menuData?.filter(menu => menu.parentId === null).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const childrenMap = new Map();
    menuData?.forEach(menu_0 => {
      if (menu_0.parentId !== null) {
        if (!childrenMap.has(menu_0.parentId)) {
          childrenMap.set(menu_0.parentId, []);
        }
        childrenMap.get(menu_0.parentId)?.push(menu_0);
      }
    });
    childrenMap.forEach(children => children.sort((a_0, b_0) => (a_0.position ?? 0) - (b_0.position ?? 0)));
    return {
      topLevelMenus: topLevel,
      childMap: childrenMap
    };
  }, [menuData]);
  const getChildren = useCallback(parentId => childMap.get(parentId) || [], [childMap]);
  if (menuData === undefined) {
    return /*#__PURE__*/_jsxs(Alert, {
      variant: "destructive",
      children: [/*#__PURE__*/_jsx(IGRPIcon, {
        iconName: "CircleAlert"
      }), /*#__PURE__*/_jsx(AlertDescription, {
        children: "Prototype mode is not enabled and no valid app ID provided."
      })]
    });
  }
  if (menuData.length === 0) {
    return /*#__PURE__*/_jsxs(Alert, {
      variant: "default",
      children: [/*#__PURE__*/_jsx(IGRPIcon, {
        iconName: "Info"
      }), /*#__PURE__*/_jsx(AlertDescription, {
        children: "App has no menu items."
      })]
    });
  }
  return /*#__PURE__*/_jsx(SidebarMenu, {
    role: "navigation",
    children: topLevelMenus?.map(menu_1 => /*#__PURE__*/_jsx(MenuItemWithSubmenus, {
      menu: menu_1,
      pathname: pathname,
      childMenus: getChildren(menu_1.id)
    }, `menu-${menu_1.id}`))
  });
}
function MenuItemWithSubmenus({
  menu,
  pathname,
  childMenus
}) {
  const {
    id,
    name,
    url,
    icon
  } = menu;
  const isActive = pathname === url;
  const hasChildren = childMenus.length > 0;
  const isExternal = url ? isExternalUrl(url) : false;
  const normalizedUrl = url ? normalizeUrl(url) : '';
  if (!hasChildren) {
    return /*#__PURE__*/_jsx(SidebarMenuItem, {
      children: /*#__PURE__*/_jsx(SidebarMenuButton, {
        asChild: true,
        tooltip: name,
        isActive: isActive,
        children: isExternal ? /*#__PURE__*/_jsxs("a", {
          href: normalizedUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          "aria-label": `${name} (opens in new tab)`,
          children: [icon && /*#__PURE__*/_jsx(IGRPIcon, {
            iconName: icon
          }), /*#__PURE__*/_jsx("span", {
            children: name
          })]
        }) : /*#__PURE__*/_jsxs(Link, {
          href: normalizedUrl,
          "aria-label": name,
          children: [icon && /*#__PURE__*/_jsx(IGRPIcon, {
            iconName: icon
          }), /*#__PURE__*/_jsx("span", {
            children: name
          })]
        })
      })
    });
  }
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx(SidebarMenuItem, {
      className: "group",
      children: /*#__PURE__*/_jsxs(DropdownMenu, {
        children: [/*#__PURE__*/_jsx(DropdownMenuTrigger, {
          asChild: true,
          children: /*#__PURE__*/_jsx(SidebarMenuButton, {
            tooltip: name,
            className: "hidden cursor-pointer group-data-[collapsible=icon]:flex",
            "aria-label": `${name} menu`,
            children: icon && /*#__PURE__*/_jsx(IGRPIcon, {
              iconName: icon
            })
          })
        }), /*#__PURE__*/_jsx(DropdownMenuContent, {
          side: "right",
          align: "start",
          className: "min-w-48",
          children: childMenus.map(subMenu => /*#__PURE__*/_jsx(SubMenuItem, {
            menu: subMenu,
            variant: "dropdown"
          }, `dropdown-${id}-${subMenu.id}`))
        })]
      })
    }), /*#__PURE__*/_jsx(SidebarMenuItem, {
      children: /*#__PURE__*/_jsxs(Collapsible, {
        className: "w-full group",
        children: [/*#__PURE__*/_jsx(CollapsibleTrigger, {
          className: "flex w-full group-data-[collapsible=icon]:hidden",
          asChild: true,
          children: /*#__PURE__*/_jsxs(SidebarMenuButton, {
            tooltip: name,
            className: "w-full cursor-pointer",
            "aria-label": `Toggle ${name} submenu`,
            "aria-expanded": "false",
            children: [icon && /*#__PURE__*/_jsx(IGRPIcon, {
              iconName: icon
            }), /*#__PURE__*/_jsx("span", {
              children: name
            }), /*#__PURE__*/_jsx(IGRPIcon, {
              iconName: "ChevronRight",
              className: "ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90",
              strokeWidth: 2
            })]
          })
        }), /*#__PURE__*/_jsx(CollapsibleContent, {
          children: /*#__PURE__*/_jsx(SidebarMenuSub, {
            children: childMenus.map(subMenu => /*#__PURE__*/_jsx(SubMenuItem, {
              menu: subMenu,
              variant: "collapsible"
            }, `collapse-${id}-${subMenu.id}`))
          })
        })]
      })
    })]
  });
}
function SubMenuItem({
  menu,
  variant
}) {
  const {
    name,
    url,
    icon
  } = menu;
  const isExternal = url ? isExternalUrl(url) : false;
  const normalizedUrl = url ? normalizeUrl(url) : '';
  const iconElement = icon && variant === 'dropdown' && /*#__PURE__*/_jsx(IGRPIcon, {
    iconName: icon
  });
  const linkContent = /*#__PURE__*/_jsxs(_Fragment, {
    children: [iconElement, /*#__PURE__*/_jsx("span", {
      children: name
    })]
  });
  const linkProps = isExternal ? {
    href: normalizedUrl,
    target: '_blank',
    rel: 'noopener noreferrer',
    'aria-label': `${name} (opens in new tab)`
  } : {
    href: normalizedUrl,
    'aria-label': name
  };
  if (variant === 'dropdown') {
    return /*#__PURE__*/_jsx(DropdownMenuItem, {
      asChild: true,
      onSelect: e => e.preventDefault(),
      className: "cursor-pointer px-2 py-2.5",
      children: isExternal ? /*#__PURE__*/_jsx("a", {
        ...linkProps,
        className: "w-full flex items-center",
        children: linkContent
      }) : /*#__PURE__*/_jsx(Link, {
        ...linkProps,
        className: "w-full flex items-center",
        children: linkContent
      })
    });
  }
  return /*#__PURE__*/_jsx(SidebarMenuSubItem, {
    children: /*#__PURE__*/_jsx(SidebarMenuSubButton, {
      asChild: true,
      children: isExternal ? /*#__PURE__*/_jsx("a", {
        ...linkProps,
        children: /*#__PURE__*/_jsx("span", {
          children: name
        })
      }) : /*#__PURE__*/_jsx(Link, {
        ...linkProps,
        children: /*#__PURE__*/_jsx("span", {
          children: name
        })
      })
    })
  });
}
//# sourceMappingURL=menus.js.map
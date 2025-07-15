'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { PanelLeftIcon } from 'lucide-react';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '../../lib/utils';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Separator } from '../primitives/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../primitives/sheet';
import { Skeleton } from '../primitives/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/tooltip';
const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const SidebarContext = /*#__PURE__*/React.createContext(null);
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(value => {
    const openState = typeof value === 'function' ? value(open) : value;
    if (setOpenProp) {
      setOpenProp(openState);
    } else {
      _setOpen(openState);
    }
    // This sets the cookie to keep the sidebar state.
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }, [setOpenProp, open]);
  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile(open_0 => !open_0) : setOpen(open_1 => !open_1);
  }, [isMobile, setOpen, setOpenMobile]);
  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);
  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? 'expanded' : 'collapsed';
  const contextValue = React.useMemo(() => ({
    state,
    open,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar
  }), [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]);
  return /*#__PURE__*/_jsx(SidebarContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/_jsx(TooltipProvider, {
      delayDuration: 0,
      children: /*#__PURE__*/_jsx("div", {
        "data-slot": "sidebar-wrapper",
        style: {
          '--sidebar-width': SIDEBAR_WIDTH,
          '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
          ...style
        },
        className: cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', className),
        ...props,
        children: children
      })
    })
  });
}
function Sidebar(t0) {
  const $ = _c(26);
  let children;
  let className;
  let props;
  let t1;
  let t2;
  let t3;
  if ($[0] !== t0) {
    ({
      side: t1,
      variant: t2,
      collapsible: t3,
      className,
      children,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = children;
    $[2] = className;
    $[3] = props;
    $[4] = t1;
    $[5] = t2;
    $[6] = t3;
  } else {
    children = $[1];
    className = $[2];
    props = $[3];
    t1 = $[4];
    t2 = $[5];
    t3 = $[6];
  }
  const side = t1 === undefined ? "left" : t1;
  const variant = t2 === undefined ? "sidebar" : t2;
  const collapsible = t3 === undefined ? "offcanvas" : t3;
  const {
    isMobile,
    state,
    openMobile,
    setOpenMobile
  } = useSidebar();
  if (collapsible === "none") {
    let t4;
    if ($[7] !== children || $[8] !== className || $[9] !== props) {
      t4 = _jsx("div", {
        "data-slot": "sidebar",
        className: cn("bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col", className),
        ...props,
        children
      });
      $[7] = children;
      $[8] = className;
      $[9] = props;
      $[10] = t4;
    } else {
      t4 = $[10];
    }
    return t4;
  }
  if (isMobile) {
    let t4;
    if ($[11] !== children || $[12] !== openMobile || $[13] !== props || $[14] !== setOpenMobile || $[15] !== side) {
      t4 = _jsx(Sheet, {
        open: openMobile,
        onOpenChange: setOpenMobile,
        ...props,
        children: _jsxs(SheetContent, {
          "data-sidebar": "sidebar",
          "data-slot": "sidebar",
          "data-mobile": "true",
          className: "bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden",
          style: {
            "--sidebar-width": SIDEBAR_WIDTH_MOBILE
          },
          side,
          children: [_jsxs(SheetHeader, {
            className: "sr-only",
            children: [_jsx(SheetTitle, {
              children: "Sidebar"
            }), _jsx(SheetDescription, {
              children: "Displays the mobile sidebar."
            })]
          }), _jsx("div", {
            className: "flex h-full w-full flex-col",
            children
          })]
        })
      });
      $[11] = children;
      $[12] = openMobile;
      $[13] = props;
      $[14] = setOpenMobile;
      $[15] = side;
      $[16] = t4;
    } else {
      t4 = $[16];
    }
    return t4;
  }
  const t4 = state === "collapsed" ? collapsible : "";
  const t5 = variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)";
  let t6;
  if ($[17] !== children || $[18] !== className || $[19] !== props || $[20] !== side || $[21] !== state || $[22] !== t4 || $[23] !== t5 || $[24] !== variant) {
    t6 = _jsxs("div", {
      className: "group peer text-sidebar-foreground hidden md:block",
      "data-state": state,
      "data-collapsible": t4,
      "data-variant": variant,
      "data-side": side,
      "data-slot": "sidebar",
      children: [_jsx("div", {
        "data-slot": "sidebar-gap",
        className: cn("relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear", "group-data-[collapsible=offcanvas]:w-0", "group-data-[side=right]:rotate-180", t5)
      }), _jsx("div", {
        "data-slot": "sidebar-container",
        className: cn("fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex", side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]", variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l", className),
        ...props,
        children: _jsx("div", {
          "data-sidebar": "sidebar",
          "data-slot": "sidebar-inner",
          className: "bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm",
          children
        })
      })]
    });
    $[17] = children;
    $[18] = className;
    $[19] = props;
    $[20] = side;
    $[21] = state;
    $[22] = t4;
    $[23] = t5;
    $[24] = variant;
    $[25] = t6;
  } else {
    t6 = $[25];
  }
  return t6;
}
function SidebarTrigger(t0) {
  const $ = _c(12);
  let className;
  let onClick;
  let props;
  if ($[0] !== t0) {
    ({
      className,
      onClick,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = onClick;
    $[3] = props;
  } else {
    className = $[1];
    onClick = $[2];
    props = $[3];
  }
  const {
    toggleSidebar
  } = useSidebar();
  let t1;
  if ($[4] !== className || $[5] !== onClick || $[6] !== props || $[7] !== toggleSidebar) {
    let t2;
    if ($[9] !== onClick || $[10] !== toggleSidebar) {
      t2 = event => {
        onClick?.(event);
        toggleSidebar();
      };
      $[9] = onClick;
      $[10] = toggleSidebar;
      $[11] = t2;
    } else {
      t2 = $[11];
    }
    t1 = _jsxs(Button, {
      "data-sidebar": "trigger",
      "data-slot": "sidebar-trigger",
      variant: "ghost",
      size: "icon",
      className: cn("size-7", className),
      onClick: t2,
      ...props,
      children: [_jsx(PanelLeftIcon, {}), _jsx("span", {
        className: "sr-only",
        children: "Toggle Sidebar"
      })]
    });
    $[4] = className;
    $[5] = onClick;
    $[6] = props;
    $[7] = toggleSidebar;
    $[8] = t1;
  } else {
    t1 = $[8];
  }
  return t1;
}
function SidebarRail(t0) {
  const $ = _c(7);
  let className;
  let props;
  if ($[0] !== t0) {
    ({
      className,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = props;
  } else {
    className = $[1];
    props = $[2];
  }
  const {
    toggleSidebar
  } = useSidebar();
  let t1;
  if ($[3] !== className || $[4] !== props || $[5] !== toggleSidebar) {
    t1 = _jsx("button", {
      "data-sidebar": "rail",
      "data-slot": "sidebar-rail",
      "aria-label": "Toggle Sidebar",
      tabIndex: -1,
      onClick: toggleSidebar,
      title: "Toggle Sidebar",
      className: cn("hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex", "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize", "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize", "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full", "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2", "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2", className),
      ...props
    });
    $[3] = className;
    $[4] = props;
    $[5] = toggleSidebar;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}
function SidebarInset({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("main", {
    "data-slot": "sidebar-inset",
    className: cn('bg-background relative flex w-full flex-1 flex-col', 'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2', className),
    ...props
  });
}
function SidebarInput({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx(Input, {
    "data-slot": "sidebar-input",
    "data-sidebar": "input",
    className: cn('bg-background h-8 w-full shadow-none', className),
    ...props
  });
}
function SidebarHeader({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("div", {
    "data-slot": "sidebar-header",
    "data-sidebar": "header",
    className: cn('flex flex-col gap-2 p-2', className),
    ...props
  });
}
function SidebarFooter({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("div", {
    "data-slot": "sidebar-footer",
    "data-sidebar": "footer",
    className: cn('flex flex-col gap-2 p-2', className),
    ...props
  });
}
function SidebarSeparator({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx(Separator, {
    "data-slot": "sidebar-separator",
    "data-sidebar": "separator",
    className: cn('bg-sidebar-border mx-2 w-auto', className),
    ...props
  });
}
function SidebarContent({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("div", {
    "data-slot": "sidebar-content",
    "data-sidebar": "content",
    className: cn('flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden', className),
    ...props
  });
}
function SidebarGroup({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("div", {
    "data-slot": "sidebar-group",
    "data-sidebar": "group",
    className: cn('relative flex w-full min-w-0 flex-col p-2', className),
    ...props
  });
}
function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : 'div';
  return /*#__PURE__*/_jsx(Comp, {
    "data-slot": "sidebar-group-label",
    "data-sidebar": "group-label",
    className: cn('text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0', 'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0', className),
    ...props
  });
}
function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : 'button';
  return /*#__PURE__*/_jsx(Comp, {
    "data-slot": "sidebar-group-action",
    "data-sidebar": "group-action",
    className: cn('text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
    // Increases the hit area of the button on mobile.
    'after:absolute after:-inset-2 md:after:hidden', 'group-data-[collapsible=icon]:hidden', className),
    ...props
  });
}
function SidebarGroupContent({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("div", {
    "data-slot": "sidebar-group-content",
    "data-sidebar": "group-content",
    className: cn('w-full text-sm', className),
    ...props
  });
}
function SidebarMenu({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("ul", {
    "data-slot": "sidebar-menu",
    "data-sidebar": "menu",
    className: cn('flex w-full min-w-0 flex-col gap-1', className),
    ...props
  });
}
function SidebarMenuItem({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("li", {
    "data-slot": "sidebar-menu-item",
    "data-sidebar": "menu-item",
    className: cn('group/menu-item relative', className),
    ...props
  });
}
const sidebarMenuButtonVariants = cva('peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0', {
  variants: {
    variant: {
      default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      outline: 'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]'
    },
    size: {
      default: 'h-8 text-sm',
      sm: 'h-7 text-xs',
      lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default'
  }
});
function SidebarMenuButton(t0) {
  const $ = _c(22);
  let className;
  let props;
  let t1;
  let t2;
  let t3;
  let t4;
  let tooltip;
  if ($[0] !== t0) {
    ({
      asChild: t1,
      isActive: t2,
      variant: t3,
      size: t4,
      tooltip,
      className,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = props;
    $[3] = t1;
    $[4] = t2;
    $[5] = t3;
    $[6] = t4;
    $[7] = tooltip;
  } else {
    className = $[1];
    props = $[2];
    t1 = $[3];
    t2 = $[4];
    t3 = $[5];
    t4 = $[6];
    tooltip = $[7];
  }
  const asChild = t1 === undefined ? false : t1;
  const isActive = t2 === undefined ? false : t2;
  const variant = t3 === undefined ? "default" : t3;
  const size = t4 === undefined ? "default" : t4;
  const Comp = asChild ? Slot : "button";
  const {
    isMobile,
    state
  } = useSidebar();
  let t5;
  let t6;
  if ($[8] !== Comp || $[9] !== className || $[10] !== isActive || $[11] !== isMobile || $[12] !== props || $[13] !== size || $[14] !== state || $[15] !== tooltip || $[16] !== variant) {
    t6 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const button = _jsx(Comp, {
        "data-slot": "sidebar-menu-button",
        "data-sidebar": "menu-button",
        "data-size": size,
        "data-active": isActive,
        className: cn(sidebarMenuButtonVariants({
          variant,
          size
        }), className),
        ...props
      });
      if (!tooltip) {
        t6 = button;
        break bb0;
      }
      if (typeof tooltip === "string") {
        let t7;
        if ($[20] !== tooltip) {
          t7 = {
            children: tooltip
          };
          $[20] = tooltip;
          $[21] = t7;
        } else {
          t7 = $[21];
        }
        tooltip = t7;
      }
      t5 = _jsxs(Tooltip, {
        children: [_jsx(TooltipTrigger, {
          asChild: true,
          children: button
        }), _jsx(TooltipContent, {
          side: "right",
          align: "center",
          hidden: state !== "collapsed" || isMobile,
          ...tooltip
        })]
      });
    }
    $[8] = Comp;
    $[9] = className;
    $[10] = isActive;
    $[11] = isMobile;
    $[12] = props;
    $[13] = size;
    $[14] = state;
    $[15] = tooltip;
    $[16] = variant;
    $[17] = t5;
    $[18] = t6;
    $[19] = tooltip;
  } else {
    t5 = $[17];
    t6 = $[18];
    tooltip = $[19];
  }
  if (t6 !== Symbol.for("react.early_return_sentinel")) {
    return t6;
  }
  return t5;
}
function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}) {
  const Comp = asChild ? Slot : 'button';
  return /*#__PURE__*/_jsx(Comp, {
    "data-slot": "sidebar-menu-action",
    "data-sidebar": "menu-action",
    className: cn('text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
    // Increases the hit area of the button on mobile.
    'after:absolute after:-inset-2 md:after:hidden', 'peer-data-[size=sm]/menu-button:top-1', 'peer-data-[size=default]/menu-button:top-1.5', 'peer-data-[size=lg]/menu-button:top-2.5', 'group-data-[collapsible=icon]:hidden', showOnHover && 'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0', className),
    ...props
  });
}
function SidebarMenuBadge({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("div", {
    "data-slot": "sidebar-menu-badge",
    "data-sidebar": "menu-badge",
    className: cn('text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none', 'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground', 'peer-data-[size=sm]/menu-button:top-1', 'peer-data-[size=default]/menu-button:top-1.5', 'peer-data-[size=lg]/menu-button:top-2.5', 'group-data-[collapsible=icon]:hidden', className),
    ...props
  });
}
function SidebarMenuSkeleton(t0) {
  const $ = _c(10);
  let className;
  let props;
  let t1;
  if ($[0] !== t0) {
    ({
      className,
      showIcon: t1,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = props;
    $[3] = t1;
  } else {
    className = $[1];
    props = $[2];
    t1 = $[3];
  }
  const showIcon = t1 === undefined ? false : t1;
  let t2;
  t2 = `${Math.floor(Math.random() * 40) + 50}%`;
  const width = t2;
  let t3;
  if ($[4] !== className || $[5] !== props || $[6] !== showIcon) {
    let t4;
    if ($[8] !== showIcon) {
      t4 = showIcon && _jsx(Skeleton, {
        className: "size-4 rounded-md",
        "data-sidebar": "menu-skeleton-icon"
      });
      $[8] = showIcon;
      $[9] = t4;
    } else {
      t4 = $[9];
    }
    t3 = _jsxs("div", {
      "data-slot": "sidebar-menu-skeleton",
      "data-sidebar": "menu-skeleton",
      className: cn("flex h-8 items-center gap-2 rounded-md px-2", className),
      ...props,
      children: [t4, _jsx(Skeleton, {
        className: "h-4 max-w-(--skeleton-width) flex-1",
        "data-sidebar": "menu-skeleton-text",
        style: {
          "--skeleton-width": width
        }
      })]
    });
    $[4] = className;
    $[5] = props;
    $[6] = showIcon;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
}
function SidebarMenuSub({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("ul", {
    "data-slot": "sidebar-menu-sub",
    "data-sidebar": "menu-sub",
    className: cn('border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5', 'group-data-[collapsible=icon]:hidden', className),
    ...props
  });
}
function SidebarMenuSubItem({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("li", {
    "data-slot": "sidebar-menu-sub-item",
    "data-sidebar": "menu-sub-item",
    className: cn('group/menu-sub-item relative', className),
    ...props
  });
}
function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}) {
  const Comp = asChild ? Slot : 'a';
  return /*#__PURE__*/_jsx(Comp, {
    "data-slot": "sidebar-menu-sub-button",
    "data-sidebar": "menu-sub-button",
    "data-size": size,
    "data-active": isActive,
    className: cn('text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0', 'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground', size === 'sm' && 'text-xs', size === 'md' && 'text-sm', 'group-data-[collapsible=icon]:hidden', className),
    ...props
  });
}
export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar };
//# sourceMappingURL=sidebar.js.map
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Separator } from '../primitives/separator';
import { SidebarTrigger } from '../primitives/sidebar';
import { IGRPBreadcrumbs } from './breadcrumbs';
import { IGRPCommandSearch } from './command-search';
import { IGRPModeSwitcher } from './mode-switcher';
import { IGRPNavUserHeader } from './nav-user-header';
import { Notifications } from './notifications';
import { cn } from '@/lib/utils';
export function IGRPHeader({
  data,
  className
}) {
  if (!data) return null;
  const {
    user,
    showBreadcrumbs,
    showSearch,
    showNotifications,
    showThemeSwitcher,
    showUser
  } = data;
  return /*#__PURE__*/_jsxs("header", {
    className: cn("bg-background sticky top-0 inset-x-0 isolate z-10 border-b flex items-center justify-between gap-2 px-4 py-2", className),
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex items-center gap-2 h-12",
      children: [/*#__PURE__*/_jsx(SidebarTrigger, {}), showBreadcrumbs && /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx(Separator, {
          orientation: "vertical",
          className: "mr-2 data-[orientation=vertical]:h-4"
        }), /*#__PURE__*/_jsx(IGRPBreadcrumbs, {})]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "flex items-center gap-2",
      children: [showSearch && /*#__PURE__*/_jsx(IGRPCommandSearch, {}), showNotifications && /*#__PURE__*/_jsx("span", {
        className: "hidden md:block",
        children: /*#__PURE__*/_jsx(Notifications, {})
      }), showThemeSwitcher && /*#__PURE__*/_jsx(IGRPModeSwitcher, {}), showUser && /*#__PURE__*/_jsx(IGRPNavUserHeader, {
        user: user
      })]
    })]
  });
}
//# sourceMappingURL=header.js.map
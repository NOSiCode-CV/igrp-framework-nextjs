'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IGRPActiveThemeProvider } from './active-theme';
import { IGRPProgressBar } from './progress-bar';
import { IGRPSessionProvider } from './session-provider';
import { IGRPThemeProvider } from './theme-provider';
import { SidebarInset, SidebarProvider } from '../../components/primitives/sidebar';
import { IGRPHeader } from '../../components/horizon/header';
import { IGRPSidebar } from '../../components/horizon/sidebar';
import { Toaster } from '../../components/primitives/sonner';
export const IGRPRootProviders = ({
  session,
  activeThemeValue,
  progressiveBarArgs,
  sessionArgs,
  themeArgs,
  children,
  defaultOpen,
  showSidebar,
  showHeader,
  sidebarData,
  headerData
}) => {
  return /*#__PURE__*/_jsx(IGRPSessionProvider, {
    session: session,
    ...sessionArgs,
    children: /*#__PURE__*/_jsx(IGRPThemeProvider, {
      attribute: "class",
      defaultTheme: "system",
      enableSystem: true,
      disableTransitionOnChange: true,
      enableColorScheme: true,
      ...themeArgs,
      children: /*#__PURE__*/_jsx(IGRPProgressBar, {
        ...progressiveBarArgs,
        children: /*#__PURE__*/_jsxs(IGRPActiveThemeProvider, {
          initialTheme: activeThemeValue,
          children: [/*#__PURE__*/_jsxs(SidebarProvider, {
            defaultOpen: defaultOpen,
            children: [showSidebar && /*#__PURE__*/_jsx(IGRPSidebar, {
              data: sidebarData
            }), /*#__PURE__*/_jsxs(SidebarInset, {
              children: [showHeader && /*#__PURE__*/_jsx(IGRPHeader, {
                data: headerData
              }), /*#__PURE__*/_jsx("main", {
                className: "flex flex-col flex-1 px-6 py-8",
                children: children
              })]
            })]
          }), /*#__PURE__*/_jsx(Toaster, {
            richColors: true
          })]
        })
      })
    })
  });
};
//# sourceMappingURL=index.js.map
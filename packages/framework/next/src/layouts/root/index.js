import { jsx as _jsx } from "react/jsx-runtime";
import { IGRPRootProviders } from '@igrp/framework-next-ui';
import { setAccessClientConfig } from '../../lib/api-config';
import { cn } from '../../lib/utils';
import { fetchAppByCode } from '../../services/applications/use-applications';
import { fetchLayoutData } from '../../services/layout/use-layout';
export async function IGRPRootLayout({ children, config, }) {
    const layoutConfig = await config;
    const { appCode, previewMode, layoutMockData, font, showSidebar, showHeader, layout, apiManagementConfig, } = layoutConfig;
    const { session, activeThemeValue, isScaled } = layout;
    let app;
    let appId;
    if (!previewMode) {
        if (!apiManagementConfig || !apiManagementConfig.baseUrl) {
            throw new Error("Preview Mode is not enabled, when not enabled, API Management config is required.");
        }
        ;
        setAccessClientConfig({
            token: session?.accessToken || '',
            baseUrl: apiManagementConfig?.baseUrl || '',
        });
        app = await fetchAppByCode(appCode);
        appId = app?.[0]?.id;
    }
    const { headerData, sidebarData } = await fetchLayoutData(layoutMockData.getHeaderData, layoutMockData.getSidebarData, previewMode, appId);
    return (_jsx("html", { lang: "pt", suppressHydrationWarning: true, className: font, children: _jsx("body", { className: cn('bg-background overscroll-none h-screen font-sans antialiased', activeThemeValue && `theme-${activeThemeValue}`, isScaled && 'theme-scaled'), children: _jsx(IGRPRootProviders, { session: session, activeThemeValue: activeThemeValue, progressiveBarArgs: undefined, sessionArgs: undefined, themeArgs: undefined, defaultOpen: true, sidebarData: sidebarData, headerData: headerData, showSidebar: showSidebar, showHeader: showHeader, children: children }) }) }));
}

---
'@igrp/framework-next': patch
---

Layout composition. Old props keep working and are marked `@deprecated`.

- `IGRPLayoutFull` takes `header`, `sidebar` (`null` for none), `toaster` and `contentClassName`. `IGRPLayoutHeader` and `IGRPLayoutSidebar` are the server pieces to pass there, with slots, labels, fallbacks or a composition of next-ui parts. `showSidebar`, `headerSlots`, `breadcrumbs` and `breadcrumbRouteLabels` on `IGRPLayoutFull` are deprecated.
- The header palette gets serializable commands built on the server from the menus the sidebar already fetches.
- `layoutData` can supply `getMenus`, `getUser` and `getApps`. When it does, the layout uses them and does not branch on preview mode. `igrpGetLayoutMenus(config)` returns the same menus for app code.
- `IGRPRootLayoutProviders` renders what `IGRPRootLayout` puts inside `<body>`, for apps that own their `<html>`. `IGRPRootLayout` takes `bodyClassName` and `themeProps`.
- `IGRPLayoutBlank` takes `toaster`.

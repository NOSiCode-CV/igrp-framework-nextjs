---
'@igrp/framework-next-ui': patch
---

The template chrome can be composed. Old props keep working and are marked `@deprecated`.

- Header parts (`IGRPHeaderRoot`, `IGRPHeaderLogo`, `IGRPHeaderTitle`, `IGRPHeaderSearch`, `IGRPHeaderUser`, …) and sidebar parts (`IGRPSidebarRoot`, `IGRPSidebarAppSwitcher`, `IGRPSidebarMenus`, `IGRPSidebarUser`) read their data from `IGRPHeaderDataProvider` / `IGRPSidebarDataProvider`. `IGRPTemplateHeader` and `IGRPTemplateSidebar` are the default composition.
- A header slot renders whenever it is supplied, whatever its `show*` flag.
- The command palette fills with the app's menus by default. `IGRPCommandPaletteProvider` and `useIGRPCommandPalette()` open and close it from anywhere and own the single ⌘K listener.
- Pages set their own trail with `<IGRPPageBreadcrumbs items>`.
- `IGRPChromeI18nProvider` takes `overrides`, merged over the parent catalog, so header and sidebar label props reach their children.
- Nav-user: `variant`, `items` / `IGRPNavUserItem`, and URLs that the header and sidebar forward.
- Auth form parts (`IGRPAuthFormRoot`, `IGRPAuthFormSignInButton`, …) allow more than one identity provider.
- Notifications: `onSelect`, `href` and controlled `open`. Menu search: controlled `query`.
- `IGRPNestedProviders` takes `themeProps`. `IGRPTemplateToaster` holds the toaster defaults.
- Contexts use React 19 `use()` and `<Context>`; `MenuItemLink` takes `ref` as a prop.

---
'@igrp/framework-next-ui': patch
---

Performance fixes for the template chrome:

- Fixed icons in the header, breadcrumbs, nav-user, theme toggle, menus, notifications and auth form render on the server. Before, they loaded one chunk per icon after hydration. Adds `lucide-react` as a dependency, at the design system's version.
- The command palette (cmdk) loads on first open, and on hover or focus of the trigger, instead of on every page.
- A navigation re-renders only the menu branches that held or now hold the active item, not the whole sidebar. Menu search is deferred while typing.
- Sidebar links prefetch on hover or focus, not when they scroll into view.
- The auth carousel only loads images for slides already shown plus the next one. It stops cycling in a hidden tab or when it isn't displayed.
- Permission-gated content no longer flips back to the login-time claims while the session refreshes.
- `IGRPSessionWatcher` refreshes with `update()`, so the tab that ran the refresh picks up the new expiry and re-arms its timer. It also refreshes when the tab becomes visible and the session is more than 60 seconds old, so apps can turn off next-auth's `refetchOnWindowFocus`.
- The theme toggle renders its icon on the server and is clickable before hydration.
- Breadcrumb overflow no longer flickers or stays clipped while the window is resized.

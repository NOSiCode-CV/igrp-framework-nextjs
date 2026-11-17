---
'@igrp/framework-next-ui': patch
---

Accessibility fixes in the app chrome (WCAG 2.1 AA):

- `IGRPRootProvidersFull` opens with a "skip to content" link and wraps the page in a single `<main id="igrp-main-content">`; the header is no longer inside the main landmark, and the no-sidebar layout now has a `<main>` at all. New optional `skipToContentLabel` prop.
- `IGRPHeaderRoot` renders a `<header>` and wraps at narrow widths; the search trigger is icon-only below `sm`, so the header fits at 320px.
- The header user-menu trigger is named after the user (`navUser.menuTrigger`), not the initials.
- The login carousel has a pause/play button and stops while hovered or focused (`authCarousel.pause`, `authCarousel.play`; `pauseLabel`/`playLabel` props).
- Header, sidebar and segment error panels use `role="alert"`; the menu filter's result count and "no results" text use `role="status"`.
- The collapsed-breadcrumb trigger shows a focus ring.
- The theme switcher no longer sets `aria-pressed` alongside its label swap; app-switcher logos have empty `alt` next to the visible app name.

New catalog keys: `shell.skipToContent`, `navUser.menuTrigger`, `authCarousel.pause`, `authCarousel.play`.

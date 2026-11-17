---
'@igrp/framework-next-ui': patch
---

- The sign-in form's heading is an `<h1>` (it was an `<h3>` and the page's only heading). It looks the same.
- The skip link's target `<main>` scrolls clear of the sticky header instead of under it.
- Decorative motion (the sign-in error slide-in, the global error panel transition, the menu folder chevron) is turned off under `prefers-reduced-motion`. Loading spinners keep spinning: they show that work is in progress.

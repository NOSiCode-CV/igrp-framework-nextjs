---
'@igrp/framework-next-ui': patch
---

App switcher: items now show a pointer cursor and a trailing arrow when
highlighted.

Each application entry and the Applications Center entry get `cursor-pointer`
and an `ArrowRight` icon that fades and slides in on hover or keyboard focus.
Reduced-motion users see it appear without the transition. Long application
names now truncate instead of pushing the arrow out of the menu.

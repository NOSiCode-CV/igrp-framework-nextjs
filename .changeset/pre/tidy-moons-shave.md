---
'@igrp/framework-next-ui': patch
---

fix(next-ui): don't crash the layout on runtime-supplied image hosts

`IGRPTemplateAppSwitcher` and `IGRPTemplateHeader` rendered app pictures and the
header logo with `next/image` using the default loader, which throws
"hostname is not configured under images" for any host missing from the
consuming app's `images.remotePatterns`. The throw escaped to
`IGRPLayoutErrorBoundary` and took the whole sidebar/header down. Since these
URLs come from the access-management backend at runtime, consumers cannot
whitelist every host up front.

Both now render through a new internal `IGRPTemplateImage`, which marks remote
sources `unoptimized` (bypassing the hostname check) and falls back to the icon
— or, for the header, to the bundled logo — when an image fails to load.

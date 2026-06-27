---
"@igrp/framework-next-ui": patch
---

Memoize `IGRPActiveThemeProvider`'s context value (the React Compiler skips
provider files, so it must be manual). Auth carousel: root backdrop uses the
`bg-muted` token and the dot row uses `flex gap-2`; on-photo caption colors are
kept as a documented fixed-contrast exception.

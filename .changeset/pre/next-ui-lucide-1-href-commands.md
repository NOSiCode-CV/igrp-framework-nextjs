---
'@igrp/framework-next-ui': patch
---

- The `lucide-react` dependency range is `^0.577.0 || ^1.0.0`, so an app on lucide 1.x shares one copy with next-ui.
- `IGRPCommandItem` takes `href` (and `external`) as an alternative to `onSelect`: the palette navigates there itself, client-side with basePath applied, or in a new tab when `external`. `onSelect` is now optional; give one of the two. The header palette passes the server-built menu commands straight through instead of mapping them to `onSelect` handlers on the client.

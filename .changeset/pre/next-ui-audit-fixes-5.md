---
'@igrp/framework-next-ui': patch
---

Sidebar menu fixes:

- An inactive folder or group now hides its whole subtree. Before, its active children showed up as top-level links.
- Only the longest matching menu entry is marked current. With `/admin` and `/admin/users`, both used to get `aria-current="page"`.
- A group nested in a group renders as a folder. Before, it was a dead `#` link and its pages were missing from the sidebar and from search.
- A `pageSlug` starting with `//` or `/\` no longer becomes a link to another site.
- A collapsed labelled section stays visible in icon mode, where its toggle is hidden.

The app switcher matches `appCode` case-insensitively and stays usable when the current app is missing from the user's app list: it lists every app and the Applications Center link instead of rendering a disabled "Unknown" button.

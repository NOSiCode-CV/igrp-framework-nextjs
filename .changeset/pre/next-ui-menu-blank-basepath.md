---
"@igrp/framework-next-ui": patch
---

Menu items that open in a new tab (`target: "_blank"`) now keep the app's `basePath` on internal links. Before, with `NEXT_PUBLIC_BASE_PATH=/apps/template`, a `pageSlug: "users"` item opened `/users` instead of `/apps/template/users`. Absolute URLs are unchanged.

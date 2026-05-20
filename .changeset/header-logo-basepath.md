---
"@igrp/framework-next-ui": patch
---

fix: prepend NEXT_PUBLIC_BASE_PATH to fallback logo src in header

When basePath is configured, the Next.js image optimizer fetches the source
image internally without the basePath prefix, causing a 500 error for local
public-folder images. The fallback src now reads NEXT_PUBLIC_BASE_PATH so the
optimizer resolves the correct path.

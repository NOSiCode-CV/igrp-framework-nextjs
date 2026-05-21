---
"@igrp/framework-next-ui": patch
---

fix: prepend NEXT_PUBLIC_BASE_PATH to auth carousel and login form images

When basePath is configured, IGRPAuthCarousel and IGRPAuthForm passed
consumer-provided image paths to next/image as-is. The optimizer fetched
them without the basePath prefix, causing 404s on `/login` for images
referenced by absolute root paths (e.g. `/logo-no-text.png`). The src
values are now resolved through an idempotent basePath prefixer so
consumers can keep passing raw `/foo.png` paths and existing already-
prefixed paths are not double-prefixed.

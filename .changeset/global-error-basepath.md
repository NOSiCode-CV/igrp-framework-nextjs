---
"@igrp/framework-next-ui": patch
---

- Prepend `NEXT_PUBLIC_BASE_PATH` to the error image in `IGRPGlobalError` so the asset resolves correctly when the app is hosted under a base path.

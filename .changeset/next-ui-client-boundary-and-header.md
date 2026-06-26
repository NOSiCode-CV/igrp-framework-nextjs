---
"@igrp/framework-next-ui": patch
---

Client-boundary and render-safety hardening:

- Add the missing top-of-file `'use client'` directive to `IGRPTemplateSidebar`, `IGRPTemplateNavUser`, `IGRPTemplateNotFound`, `IGRPTemplateLoading`, and `IGRPThemeProvider`. They use client-only hooks / DS components and previously relied on the package barrel's boundary, which would break the moment any of them was imported via a deeper path.
- `IGRPTemplateHeader` no longer calls `igrpToast()` during render (a side effect that updated the toaster provider mid-render — a React anti-pattern and impure under the React Compiler). The no-data warning now runs in a `useEffect`, and the component returns `null` instead of `undefined`.

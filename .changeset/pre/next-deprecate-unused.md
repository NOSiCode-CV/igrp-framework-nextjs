---
"@igrp/framework-next": patch
---

Deprecated, because the framework does not use them: `igrpBuildQueryString` (use `URLSearchParams`), `IGRPGlobalLoading` (use `IGRPTemplateLoading` from `@igrp/framework-next-ui`) and the `./client` entry with `useLayoutData` (call `useRouter().refresh()`). They are removed in a later release.

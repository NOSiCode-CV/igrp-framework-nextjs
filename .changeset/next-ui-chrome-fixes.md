---
"@igrp/framework-next-ui": patch
---

Sign-in failures always show the localised catalog message instead of the thrown error text. The error-page image is decorative (`alt=""`). The missing-header-data toast only shows outside production. Removed the unused `themeSelector` group from `IGRPChromeStrings` and `IGRPChromeStringsOverride`: apps that set `chrome.themeSelector` overrides now get a TypeScript excess-property error and should drop the key.

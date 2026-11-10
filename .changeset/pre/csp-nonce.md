---
'@igrp/framework-next': patch
'@igrp/framework-next-ui': patch
---

An app can now enforce a nonce-based Content-Security-Policy: the theme boot script next-themes inlines in the HTML carries the request's nonce.

- `@igrp/framework-next`: `IGRPRootLayout` takes an optional `nonce` prop and passes it to the providers. The app reads it from the request (the `x-nonce` header its middleware sets) in its own root layout.
- `@igrp/framework-next-ui`: `IGRPNestedProviders` takes an optional `nonce` prop and passes it to `IGRPThemeProvider`. Without it nothing changes.

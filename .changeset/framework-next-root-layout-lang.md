---
"@igrp/framework-next": patch
---

`IGRPRootLayout` accepts an optional `lang` prop that sets the server-rendered `<html lang>`, so apps can render the document in the user's resolved locale. Defaults to `"pt"`, keeping the previous output for apps that don't pass it.

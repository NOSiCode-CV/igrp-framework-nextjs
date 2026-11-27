---
"@igrp/template-migrator": patch
---

Migration `110-client-messages-server-home`: the template sends only the `auth` and `errors` message namespaces to the browser (`i18n.clientNamespaces`), the home page is a Server Component with a separate client copy button, and two independent awaits in the root layout's metadata and the home page now run in parallel.

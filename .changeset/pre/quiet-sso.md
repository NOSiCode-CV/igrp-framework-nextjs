---
"@igrp/template-migrator": patch
---

- New template migration: `/login` signs the user in silently (OIDC `prompt=none`) when the IdP session is still alive, and NextAuth error redirects keep the app's basePath.
- New migrations pin the latest framework versions.

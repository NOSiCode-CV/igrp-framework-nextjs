---
"@igrp/template-migrator": patch
---

Migration 89: `/logout` asks for confirmation unless the request came from the app itself, so another site can no longer sign users out of the IdP and every co-hosted app.

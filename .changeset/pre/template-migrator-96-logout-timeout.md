---
"@igrp/template-migrator": patch
---

Migration 96: the demo-v1 logout page waits 5 s for the end-session URL instead of 3 s, above the server's 4 s discovery timeout, so a slow IdP no longer ends in a local-only logout.

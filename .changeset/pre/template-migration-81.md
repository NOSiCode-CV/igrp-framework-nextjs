---
"@igrp/template-migrator": patch
---

Migration 81: logout writes the host-logout cookie before the IdP round-trip, so a logout the IdP never redirects back from no longer leaves the session usable after 5 minutes; middleware's public-path check runs in linear time on long dotted paths.

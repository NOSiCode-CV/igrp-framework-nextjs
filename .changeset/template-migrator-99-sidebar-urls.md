---
"@igrp/template-migrator": patch
---

Migration 99: demo-v1's `getSidebarData` passes the profile, notifications and settings URLs from the same env vars as the header. Before, the sidebar user menu fell back to `/profile` and `/settings` under the basePath.

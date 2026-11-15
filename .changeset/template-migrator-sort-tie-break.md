---
"@igrp/template-migrator": patch
---

Migrations that share a number (the two `47.MIGRATIONS-*` files) are now ordered by file name, so pack, the template lock and the drift check agree on Windows and Linux. Before, their order was whatever the directory listing returned, which differs between NTFS and ext4.

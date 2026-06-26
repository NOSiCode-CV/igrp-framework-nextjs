---
"@igrp/framework-next-ui": patch
---

Menu tree React keys fall back to `code` when a menu entry has no `id`,
avoiding `folder-undefined`/`leaf-undefined` key collisions.

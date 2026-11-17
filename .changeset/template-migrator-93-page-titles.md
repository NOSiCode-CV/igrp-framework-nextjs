---
'@igrp/template-migrator': patch
---

Migration 93: every template page has its own title. The root layout uses a `"%s · <app title>"` template, and login, logout and the forbidden pages set theirs from the message catalogs (new `login.pageTitle`).

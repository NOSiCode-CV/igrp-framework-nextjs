---
'@igrp/framework-next-ui': patch
---

The sidebar now highlights a menu item whose `url` carries a query string (`/users?tab=1` on `/users`) or whose `pageSlug` ends in a slash (`users/`). Both used to stay unhighlighted. When several items match, the deepest route wins; a long query string no longer counts towards it.

`isSafeCssValue` and `isSafeLogoUrl` return `false` for a value that is not a string, instead of throwing a `TypeError`. Their parameter type is now `unknown`.

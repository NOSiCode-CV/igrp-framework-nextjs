---
"@igrp/framework-next-ui": patch
---

`IGRPTemplateNavUser` now passes `user.picture` to `IGRPUserAvatar`, so profile photos render in the nav-user dropdown trigger (header and sidebar). Previously `image` was never supplied, so the avatar always fell back to initials. Users without a `picture` are unaffected — the avatar still falls back to initials.

---
"@igrp/framework-next-auth": patch
---

Session-cookie scheme detection now looks only at the app's own cookie names, so another co-hosted app's `__Secure-` cookie can no longer send it into a login loop. Also exports `HOST_LOGOUT_COOKIE` and `HOST_LOGOUT_COOKIE_MAX_AGE_S` from `./cookies`.

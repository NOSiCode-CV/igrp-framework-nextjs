---
'@igrp/framework-next-auth': patch
---

Refresh-token recovery now follows the whole rotation chain (up to 5 hops) instead of one. In cookie mode, two rotations with no cookie write in between used to make the next request refresh with a token that was already spent: the IdP read it as reuse and ended the session, or the user was sent to `/logout` with a valid session. `performRefresh` now checks for a newer rotation before calling the IdP, and sign-out revokes the newest refresh token in the chain.

`resolveAppUrl` (login redirect) now takes the base path from the `NEXTAUTH_URL` path first, like the post-login and post-logout redirects already did. Before, a `NEXT_PUBLIC_BASE_PATH` that disagreed with `NEXTAUTH_URL` sent login to one base path and every other redirect to the other. The mismatch warning now says which one wins.

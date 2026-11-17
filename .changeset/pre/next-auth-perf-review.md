---
'@igrp/framework-next-auth': patch
---

The client session no longer carries `idToken`. Nothing in the browser read it: logout builds `id_token_hint` from the server-side JWT. This makes every page's session payload smaller. `Session.idToken` stays on the type, marked `@deprecated`. Code outside this repo that read it from `useSession()` now gets `undefined`; read it on the server from the JWT instead.

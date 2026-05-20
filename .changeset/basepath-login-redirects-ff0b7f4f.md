---
"@igrp/framework-next-auth": patch
---

fix: respect NEXT_PUBLIC_BASE_PATH in login redirect URLs

`useSafeSession` default `forceLogoutCallbackUrl` and `getLoginRedirectUrl` both
produced URLs without the basePath when `NEXT_PUBLIC_BASE_PATH` is set, causing
redirects to `/login` instead of `/{basePath}/login`. Both now read
`process.env.NEXT_PUBLIC_BASE_PATH` (a build-time NEXT_PUBLIC constant) to
prepend the basePath automatically.

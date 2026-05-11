---
"@igrp/framework-next": patch
---

fix(framework-next): replace React.cache with module-level object in api-config; remove React.cache wrappers from fetch hooks

React.cache does not work across Server Action invocations — each call returns a fresh instance, so igrpSetAccessClientConfig and igrpGetAccessClientConfig were operating on different objects, causing "baseUrl is not configured" errors in server actions.

api-config now uses a plain module-level mutable object. The fetch hooks (use-user, use-applications, use-menus) drop the outer cache() wrapper; unstable_cache inside each still handles persistent cross-request caching.

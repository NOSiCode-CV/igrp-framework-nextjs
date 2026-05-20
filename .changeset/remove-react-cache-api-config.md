---
"@igrp/framework-next": patch
---

fix(framework-next): replace React.cache with AsyncLocalStorage in api-config

React.cache only memoizes within an active React render tree. Server Actions run as plain Node.js handlers outside any React context, so each call to getPerRequestConfig() returned a new default object — igrpSetAccessClientConfig and igrpGetAccessClientConfig were operating on different objects, causing "Access Management client is not configured" errors in Server Actions.

AsyncLocalStorage propagates context through async call chains in both RSC renders and Server Actions, correctly isolating concurrent requests.

---
"@igrp/framework-next-auth": patch
---

The RFC 7662 token-introspection request now uses the same 4s timeout as discovery and revocation. A slow or hanging introspection endpoint no longer stalls token refreshes; on timeout the check fails open (token assumed live), as before.

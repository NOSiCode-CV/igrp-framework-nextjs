---
"@igrp/framework-next": patch
---

An `IgrpError` with a machine-stable `code` (`/^[A-Z][A-Z0-9_]*$/`) now sets `digest` to `<id>|<code>`, the `AppError` digest shape. Next keeps a digest the error already has, so a server-thrown `IgrpError` keeps its code on the client in production. The message and context never go into the digest. `parsePublicDigest(digest)` returns a new `code` field and reads a code-shaped public part as `code`, not `message`. New export `encodePublicCodeDigest(code)` from `./app-error`. The reference an error screen shows for an `IgrpError` is now this generated id, not Next's hash.

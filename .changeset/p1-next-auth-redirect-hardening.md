---
"@igrp/framework-next-auth": patch
---

Harden redirect sanitization: reject backslash (raw and %5C-encoded) and
path-traversal vectors in `sanitizeRedirectUrl`, and route the NextAuth
`redirect` callback's relative-path branch through it. Closes a
protocol-relative open-redirect (`/\evil.com`) at the framework layer.

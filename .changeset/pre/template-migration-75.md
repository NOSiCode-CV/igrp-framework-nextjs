---
"@igrp/template-migrator": patch
---

Migration 75: demo-v1 multi-app auth sessions. It adds the host-wide logout signal, `/login?reason=session_ended` (clear the local session, then silent SSO), Secure marker cookies on HTTPS, and a root `forbidden.tsx` for 403s thrown by the `(igrp)` layout. Its steps replace whole files, so apps that changed `middleware.ts` or the login/logout pages should merge by hand.

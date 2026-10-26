---
"@igrp/framework-next": patch
---

A 401 from Access Management now redirects to `/login?reason=session_ended` so the app can clear its local session, and a 403 renders `forbidden()` instead of looping through sign-in.

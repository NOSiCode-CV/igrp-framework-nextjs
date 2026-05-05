---
"@igrp/framework-next-auth": patch
---

useSafeSession() now calls signOut() immediately when forceLogout is detected, eliminating the need for a navigation to trigger logout after refresh failure.

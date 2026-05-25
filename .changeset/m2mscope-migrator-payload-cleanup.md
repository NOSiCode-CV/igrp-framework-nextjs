---
'@igrp/template-migrator': patch
---

docs(template-migrator): remove stale IGRP_M2M_SCOPE references from payloads

Drop the `IGRP_M2M_SCOPE` documentation and bare env line from the migration 08 and 09 payload `.env.example` files. The variable was deprecated and removed from the framework runtime; leaving it in the payloads would re-inject a no-op env var into consumer apps that apply these migrations.

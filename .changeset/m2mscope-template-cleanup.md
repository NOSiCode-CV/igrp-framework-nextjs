---
'@igrp/framework-next-template': patch
---

docs(template): remove stale IGRP_M2M_SCOPE references

The `IGRP_M2M_SCOPE` env var was deprecated and removed from the framework runtime during the OAuth2 client_credentials migration. Its corresponding documentation in `.env.example` and `README.md` had been retained — now removed. The runtime ignores any value set in the operator's environment.

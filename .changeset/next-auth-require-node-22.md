---
"@igrp/framework-next-auth": patch
---

Require Node `>=22` (`engines.node`). As the root of the framework dependency chain this package previously declared no Node floor at all, leaving consumers and CI unconstrained while every other framework package requires Node 22.

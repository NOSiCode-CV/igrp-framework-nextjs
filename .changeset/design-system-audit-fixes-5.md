---
'@igrp/igrp-framework-react-design-system': patch
---

`convertValuesToFormData` now sends a cleared field (`null`) and an empty array as `""`, so a multipart edit form can clear a value. Before, the key was left out and the server kept the old value. `undefined` is still skipped. `igrpNormalizeUrl` matches `http://` and `https://` case-insensitively, so `HTTPS://host` is no longer turned into the in-app path `/HTTPS://host`.

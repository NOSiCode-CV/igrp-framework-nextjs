---
'@igrp/framework-next': patch
---

Add the organization branding loader with a per-process cache, `igrpBrandingMetadata`, `igrpResolveRequestBranding` and `igrpInvalidateBranding`. The root layout applies the Brand only when `branding.enabled` is true.

---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPStepperProcess` mounts its own tooltip provider. It threw "Tooltip must be used within TooltipProvider" when the app-level provider came from a different copy of the design system or radix-ui.

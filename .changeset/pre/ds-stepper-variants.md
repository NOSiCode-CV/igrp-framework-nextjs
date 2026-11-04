---
"@igrp/igrp-framework-react-design-system": patch
---

`StepperIndicator`: new opt-in `variant` (`number`, `size-8`; `ring`); without it the indicator is unchanged. `StepperSeparator` positions itself from the indicator variant, and active/completed states use the step tokens. The active indicator no longer renders muted text on the primary background.

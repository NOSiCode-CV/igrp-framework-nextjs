---
'@igrp/framework-next-ui': patch
---

Fix `@igrp/framework-next-ui/tokens`: its CSS imported the design system's removed `/styles` entry, so any consumer importing the tokens entry (as documented in the README) failed to compile with `"./styles" is not exported`. It now re-exports `@igrp/igrp-framework-react-design-system/tokens`, and the README CSS section was updated to match.

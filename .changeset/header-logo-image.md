---
"@igrp/framework-next-ui": patch
---

fix: replace fill with explicit dimensions on header logo image

The `fill` prop on the logo `<Image>` caused it to be invisible when
combined with a flex parent. Replaced with explicit `width={40} height={40}`
and added `overflow-hidden` to the container for correct rounded-corner clipping.

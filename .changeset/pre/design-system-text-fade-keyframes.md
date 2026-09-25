---
'@igrp/igrp-framework-react-design-system': patch
---

Ship `@keyframes igrp-text-fade-in` in `/tokens` so `IGRPText`'s `animate` prop
works in consuming apps.

The keyframes lived in `index.css`, which is only the Storybook root stylesheet.
Consumers import `/tokens` alone, so Tailwind generated the
`animate-[igrp-text-fade-in_…]` utility from the scanned `dist/` but emitted no
keyframes for it. The animation silently did nothing outside Storybook. The
keyframes now live in `tokens.css`. Consumers don't need to change anything.

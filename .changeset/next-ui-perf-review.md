---
"@igrp/framework-next-ui": patch
---

Performance fixes from a review against the Vercel React rules:

- The header logo and the app switcher images no longer use `priority`. The header preloaded both the light and the dark logo at high priority on every page, and one of them is always hidden.
- The command palette folds (accents and case) each item's keywords once when it renders, not again on every keystroke for every item.
- A sidebar folder in expanded mode no longer mounts a tooltip that can never show.

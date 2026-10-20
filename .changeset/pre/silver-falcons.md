---
"@igrp/framework-next-ui": patch
---

- Fixed the sidebar menu search: results now show the item's icon, highlight the matched text, and display a result count, matching the visual style of the rest of the menu.
- Added a clear ("×") button to the search field and disabled spellcheck/autocomplete, removing the browser's red squiggly underline on typed queries.
- Replaced the plain "no results" text with a dashed empty-state card (icon + quoted query), consistent with the existing "no menus" empty state.

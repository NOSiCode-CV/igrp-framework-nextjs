---
"@igrp/igrp-framework-react-design-system": patch
---

Phone country names localize only after hydration; pagination and breadcrumb ellipsis sr-only text comes from the i18n catalog (`pagination.morePages`, `breadcrumb.more`).

The breadcrumb `<nav>` takes its accessible name from the new `breadcrumb.label` catalog key instead of the English "breadcrumb".

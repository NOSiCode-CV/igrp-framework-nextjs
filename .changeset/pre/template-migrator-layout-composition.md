---
'@igrp/template-migrator': patch
---

Adds migration `91-layout-composition`: the template drops its own search palette (`header-search.ts`, `app-search.tsx`) now that the framework fills the default one, uses `IGRPLayoutHeader` for its header slot, picks one layout data source for preview or live, and simplifies the home page status.

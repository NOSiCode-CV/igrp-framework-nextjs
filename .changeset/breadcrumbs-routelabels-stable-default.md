---
"@igrp/framework-next-ui": patch
---

fix(next-ui): stabilize IGRPTemplateBreadcrumbs routeLabels default so the memo is not busted every render

The `routeLabels` prop defaulted to a fresh `{}` literal, which changed identity on every render and broke the `useMemo` that derives breadcrumb items (the common case where the prop is omitted recomputed every render). It now defaults to a shared frozen module-level reference, so the memo is stable. No API change.

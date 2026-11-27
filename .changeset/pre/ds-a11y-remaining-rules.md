---
"@igrp/igrp-framework-react-design-system": patch
---

Light `--destructive` darkens to `oklch(0.52 0.245 27.325)`, so the destructive button and soft destructive text on a selected table row reach 4.5:1 contrast.
Light `--warning` darkens to `oklch(0.53 0.188 70.08)`, so soft warning text on a selected table row reaches 4.5:1 contrast.
Dark `--success` lightens to `oklch(0.66 0.194 150.069)`, so soft success text on a selected table row reaches 4.5:1 contrast in dark mode.
`IGRPDataTableFilterSelect` gives its trigger an accessible name (`dataTable.filterLabel`, overridable with the new `ariaLabel` prop, also read from a `select` filter descriptor).
Light `--indigo` darkens to `oklch(0.55 0.25 292.717)`, so soft indigo text on a selected table row reaches 4.5:1 contrast.

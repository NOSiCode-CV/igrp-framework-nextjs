---
"@igrp/igrp-framework-react-design-system": patch
---

design-system: define the missing `--chart-6/7/8` tokens (violet/red/lime, light + dark) that `IGRP_CHART_COLORS` already referenced, so charts with 6–8 series render correct fills instead of blanks. Replace the hardcoded `dark:border-slate-800/60` on the data-table header row with the semantic `border-border` token. Make the data-table input-filter accessible label configurable via a new `ariaLabel` prop (and matching `ariaLabel` on the filter descriptor); pt-PT default labels are unchanged.

template: extend the theme variants (blue/green/amber/default/mono) beyond `--primary` to also re-theme `--ring`, `--sidebar-primary`, and (for the colored themes) the primary `--chart-1` series, so a selected theme expresses brand identity across focus rings, the active sidebar item, and charts.

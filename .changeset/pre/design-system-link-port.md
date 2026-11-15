---
"@igrp/igrp-framework-react-design-system": patch
---

The rich-text link box treats `host:8443/path` as a host with a port and adds `https://`, instead of reading `host:` as a scheme and rejecting the link.

`ChartContainer` cleans its `id` the same way as series keys before using it in the chart's CSS selector, so an id with spaces or quotes no longer drops every colour in the chart, and an id containing `</style>` cannot close the style tag.

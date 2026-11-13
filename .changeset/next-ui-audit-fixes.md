---
"@igrp/framework-next-ui": patch
---

- Command search: items get a unique cmdk `value` (`id`, else group + label + position) with the label as a keyword, so two items with the same label no longer highlight together and Enter runs the one selected.
- Header: an empty `userProfileUrl` / `notificationsUrl` now falls back to `/profile` / `/notifications` instead of rendering `href=""`.
- `IGRPSessionProvider` is now a direct re-export of `SessionProvider`; same name and props.
- Removed the unused internal `stripBasePath` helper.

---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-ui": patch
---

Spacing now uses `flex` + `gap-*` instead of `space-x-*` / `space-y-*`, following the shadcn rule. Tailwind v4 builds `space-y-*` as a margin on every child but the last, so a hidden or empty last child left a visible blank band.

- `IGRPTextList` (and `igrpTextlistVariants`): the list is `flex flex-col`; `spacing` maps to `gap-1` / `gap-2` / `gap-4`.
- `IGRPInputFile`: the error list uses `flex flex-col gap-1`. List markers stay.
- `IGRPModalDialog` header: dropped a no-op `space-y-0`.
- next-ui: the auth form, the segment error view and the nav-user menu header use `gap-*`.

The `AvatarGroup` primitive keeps `-space-x-2`: the avatars overlap with a negative margin, which `gap` cannot do.

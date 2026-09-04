---
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
"@igrp/template-migrator": patch
"@igrp/framework-next-template": patch
---

feat(header): inject consumer components into the template header via `headerSlots`

`IGRPLayoutFull` accepts a new `headerSlots` prop, letting an app render its own
components in positions the framework owns: `start` (left region, after the
logo/title), and `search`, `notifications`, `settings` and `actions` in the right
cluster. `IGRPTemplateHeader` gains the matching `slots` prop and exports the
`IGRPHeaderSlots` type.

The framework still fetches and owns all header data — user, logo, breadcrumbs,
sidebar trigger. A slot only replaces what renders in its position. `showSearch`,
`showNotifications` and `showSettings` continue to gate their positions; `start`
and `actions` are gated by the presence of the node. Each slot renders inside its
own `<Suspense>`, so an async Server Component slot cannot delay the rest of the
bar. Supplying a `notifications` slot also suppresses nav-user's link-only
Notifications entry, which the injected component doesn't own.

Also fixes the built-in command palette, which `IGRPTemplateHeader` mounted with
no `commands` prop — `⌘K` opened a palette that could never contain anything. The
template now supplies a menu-derived palette through the `search` slot, shipped as
template migration `34-header-slots-and-app-search`.

---
status: accepted
---

# Rich text ships as a `/rich-text` subpath with one fixed schema

`IGRPRichTextEditor` and `IGRPRichTextView` (consumer requests §9 and §10) are exported only from `@igrp/igrp-framework-react-design-system/rich-text`, never from the root barrel, and TipTap is a set of exact-pinned `dependencies`, not peers. Both components share a single rich-text schema that the DS owns; a toolbar preset narrows only what the editor *offers*, and the view takes no preset at all. Our build is file-per-module with no bundler, so an app that never imports `/rich-text` never bundles TipTap — the only cost of a regular dependency is install size. Pinning matters because the editor's hard-won behaviours (callbacks bound once, `editable` not propagating, v3 not re-rendering on selection) are quirks of a specific TipTap version.

## Considered Options

- **Separate package (`@igrp/igrp-framework-react-rich-text`)** — rejected: a new link in the dependency order and a new release script for no bundle-size gain over a subpath.
- **Subpath with TipTap as optional peers** — rejected: every consuming app installs and version-syncs eleven packages itself, and can drift onto a TipTap version the editor was never tested against.
- **Headless toolbar + chrome, app owns TipTap** — rejected: leaves the non-obvious behaviours, which are the real value of the request, to every app.
- **Presets that narrow the schema, or an app-supplied schema** — rejected: the view relies on the schema as its allow-list, so a view narrower than the editor silently eats saved content and a wider one is an XSS hole (one SIGOVP backend echoes stored HTML unsanitised). One DS-owned schema makes an editor/view mismatch impossible by construction.

## Consequences

- The root barrel and `/rich-text` must never import each other; a client-boundaries assertion guards it.
- Widening the schema (images, raw HTML, atomic variable nodes, app extensions) is a DS change that widens what every stored body may render — review it as a security change.
- The rich-text typography is DS-owned descendant classes on semantic tokens, not `@tailwindcss/typography`: the template migrator cannot add a dependency to an upgraded app, and without the plugin `prose` fails silently (preflight strips list markers and heading sizes). Consumers need no setup beyond the `@source` they already have.

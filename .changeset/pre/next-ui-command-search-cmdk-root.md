---
"@igrp/framework-next-ui": patch
---

Fix the header command palette crashing the whole header when opened (Ctrl+K / ⌘K).

`IGRPTemplateCommandSearch` rendered `CommandInput` / `CommandList` directly inside the design system's `CommandDialog`. The current (shadcn-shaped) `CommandDialog` renders its children straight into `DialogContent` and no longer supplies the cmdk root, so `CommandInput` threw `Cannot read properties of undefined (reading 'subscribe')` on mount and `IGRPLayoutErrorBoundary` replaced the header with "Falha ao carregar o cabeçalho". The palette content is now wrapped in the design system's `Command`, matching the upstream shadcn composition. Filtering, grouping and the pt-PT labels are unchanged.

Apps that compose `CommandDialog` / `IGRPCommandDialog` themselves need the same wrapper: `<CommandDialog><Command>…</Command></CommandDialog>`.

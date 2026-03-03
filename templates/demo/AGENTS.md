# AI Agent Instructions – IGRP Template

This project is a development template that uses the **published** design system package `@igrp/igrp-framework-react-design-system`.

## Primary Rule: Design System First

When the user asks to create UI, forms, tables, modals, buttons, inputs, or any interface component:

1. **Use the design system as the first and default option.** Do not create components from scratch or suggest other UI libraries.
2. **Import from** `@igrp/igrp-framework-react-design-system`.
3. **Prefer Horizon components** (e.g. `IGRPButton`, `IGRPInputText`, `IGRPCard`, `IGRPForm`, `IGRPDataTable`) over Primitives unless composing custom behavior.
4. **Read `DESIGN_SYSTEM.md`** in this directory for the full component catalog, types, and usage patterns.

## Context

- The design system is a **published npm package** (see `package.json`).
- This template consumes it; there is no local `packages/design-system` folder.
- All UI should be built with design system components unless the user explicitly requests otherwise.

---
name: igrp-primitives
description: >-
  Compose custom UI with IGRP Design System primitives (IGRPButtonPrimitive,
  IGRPCardPrimitive, IGRPInputPrimitive, etc.). Use when the user needs low-level
  building blocks, custom compositions, or when Horizon components don't fit.
  Prefer Horizon components first; use primitives only when necessary.
---

# IGRP Primitives Skill

Build custom UI with IGRP primitives. Use when Horizon components don't cover your use case.

## Quick Start

```tsx
import {
  IGRPButtonPrimitive,
  IGRPCardPrimitive,
  IGRPInputPrimitive,
  IGRPSelectPrimitive,
  IGRPDialogPrimitive,
} from '@igrp/igrp-framework-react-design-system';
```

## Key Rules

- **Prefer Horizon first**: Use IGRPButton, IGRPCard, IGRPInputText, etc. before primitives
- Primitives are exported as `IGRP*Primitive` (e.g. `IGRPButtonPrimitive`)
- Use for custom compositions, Radix-based builds, or when you need full control

## Reference

- [primitives-overview.md](references/primitives-overview.md) – Full list and categories

---
name: igrp-button
description: >-
  Create buttons with IGRP Design System using IGRPButton. Use when the user asks
  for buttons, submit buttons, loading buttons, icon buttons, or button variants.
  Always prefer IGRPButton over raw HTML button or other UI libraries when working
  in templates/demo or with @igrp/igrp-framework-react-design-system.
---

# IGRP Button Skill

Build buttons with the IGRP Design System. Uses `IGRPButton` with variants, sizes, icons, and loading states.

## Quick Start

```tsx
import { IGRPButton } from '@igrp/igrp-framework-react-design-system';

<IGRPButton>Save</IGRPButton>
<IGRPButton variant="outline" size="sm">Cancel</IGRPButton>
<IGRPButton variant="destructive">Delete</IGRPButton>
<IGRPButton loading loadingText="Saving...">Submit</IGRPButton>
<IGRPButton size="icon" iconName="Plus">Add</IGRPButton>
```

## Key Rules

- Use `variant` for style: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Use `size` for dimensions: `default`, `xs`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`
- Use `loading` and `loadingText` for async actions
- Use `showIcon`, `iconName`, `iconPlacement` for icon buttons
- Integrates with IGRPForm when used inside form context (type="submit")

## References

- [button.md](references/button.md) – Full API, variants, sizes, icon usage

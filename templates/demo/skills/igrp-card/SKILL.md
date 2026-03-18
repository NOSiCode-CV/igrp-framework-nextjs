---
name: igrp-card
description: >-
  Create cards with IGRP Design System using IGRPCard. Use when the user asks for
  cards, card layouts, content containers, or card headers/footers. Always prefer
  IGRPCard over raw divs or other UI libraries when working in templates/demo or
  with @igrp/igrp-framework-react-design-system.
---

# IGRP Card Skill

Build card containers with the IGRP Design System. Uses `IGRPCard` and sub-components.

## Quick Start

```tsx
import {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardDescription,
  IGRPCardContent,
  IGRPCardFooter,
  IGRPCardAction,
} from '@igrp/igrp-framework-react-design-system';

<IGRPCard>
  <IGRPCardHeader>
    <IGRPCardTitle>Title</IGRPCardTitle>
    <IGRPCardDescription>Optional description</IGRPCardDescription>
    <IGRPCardAction>
      <IGRPButton size="icon-sm" iconName="MoreHorizontal" />
    </IGRPCardAction>
  </IGRPCardHeader>
  <IGRPCardContent>Content here</IGRPCardContent>
  <IGRPCardFooter>Footer actions</IGRPCardFooter>
</IGRPCard>
```

## Key Rules

- Use `IGRPCard` as the wrapper
- `IGRPCardHeader` contains title, description, and optional action
- `IGRPCardContent` for main body
- `IGRPCardFooter` for actions (buttons, links)

## References

- [card.md](references/card.md) – Full API
- [card-details.md](references/card-details.md) – IGRPCardDetails for key-value layouts

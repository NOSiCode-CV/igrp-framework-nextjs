---
name: igrp-modal
description: >-
  Create modal dialogs with IGRP Design System using IGRPModalDialog. Use when
  the user asks for modals, dialogs, popups, or confirm dialogs. Always prefer
  IGRPModalDialog and IGRPAlertDialog over raw HTML or other UI libraries when
  working in templates/demo or with @igrp/igrp-framework-react-design-system.
---

# IGRP Modal Skill

Build modal dialogs with the IGRP Design System.

## Quick Start

```tsx
import {
  IGRPModalDialog,
  IGRPModalDialogTrigger,
  IGRPModalDialogContent,
  IGRPModalDialogHeader,
  IGRPModalDialogTitle,
  IGRPModalDialogDescription,
  IGRPModalDialogFooter,
  IGRPModalDialogClose,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';

<IGRPModalDialog>
  <IGRPModalDialogTrigger asChild>
    <IGRPButton>Open</IGRPButton>
  </IGRPModalDialogTrigger>
  <IGRPModalDialogContent size="lg">
    <IGRPModalDialogHeader>
      <IGRPModalDialogTitle>Title</IGRPModalDialogTitle>
      <IGRPModalDialogDescription>Description</IGRPModalDialogDescription>
    </IGRPModalDialogHeader>
    <p>Content</p>
    <IGRPModalDialogFooter>
      <IGRPModalDialogClose asChild>
        <IGRPButton variant="outline">Cancel</IGRPButton>
      </IGRPModalDialogClose>
      <IGRPButton>Save</IGRPButton>
    </IGRPModalDialogFooter>
  </IGRPModalDialogContent>
</IGRPModalDialog>
```

## Key Rules

- Use `IGRPModalDialogContent` with `size`: `sm`, `md`, `lg`, `xl`, `full`
- Use `stickyHeader` and `stickyFooter` on Header/Footer for long content
- `IGRPAlertDialog` for confirm/cancel dialogs

## References

- [modal-dialog.md](references/modal-dialog.md) – Full API
- [alert-dialog.md](references/alert-dialog.md) – Confirm dialogs

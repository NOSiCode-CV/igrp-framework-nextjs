---
name: igrp-feedback
description: >-
  Create feedback UI with IGRP Design System using IGRPAlert, IGRPNotification,
  IGRPBadge, IGRPLoadingSpinner, IGRPToaster, useIGRPToast. Use when the user
  asks for alerts, notifications, badges, loading states, or toasts. Always
  prefer IGRP feedback components when working in templates/demo or with
  @igrp/igrp-framework-react-design-system.
---

# IGRP Feedback Skill

Build feedback UI with the IGRP Design System.

## Quick Start

```tsx
import {
  IGRPAlert,
  IGRPNotification,
  IGRPBadge,
  IGRPLoadingSpinner,
  IGRPToaster,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

// Alert
<IGRPAlert variant="destructive" title="Error" description="Something went wrong" />

// Badge
<IGRPBadge variant="success">Active</IGRPBadge>

// Loading
<IGRPLoadingSpinner />

// Toast (add IGRPToaster to layout, then:)
const { toast } = useIGRPToast();
toast.success('Saved!');
```

## References

- [alert.md](references/alert.md) – IGRPAlert
- [notification.md](references/notification.md) – IGRPNotification
- [badge.md](references/badge.md) – IGRPBadge
- [toaster.md](references/toaster.md) – IGRPToaster, useIGRPToast

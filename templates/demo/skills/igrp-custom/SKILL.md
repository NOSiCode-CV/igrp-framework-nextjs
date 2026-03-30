---
name: igrp-custom
description: >-
  Create custom domain components with IGRP Design System using IGRPStatsCard,
  IGRPStatsCardMini, IGRPStatusBanner, IGRPUserAvatar, IGRPStatsCardTopBorderColored.
  Use when the user asks for stats cards, dashboards, status banners, user
  avatars, or KPI displays. Always prefer IGRP custom components when working
  in templates/demo or with @igrp/igrp-framework-react-design-system.
---

# IGRP Custom Skill

Build domain-specific UI with IGRP custom components.

## Quick Start

```tsx
import {
  IGRPStatsCard,
  IGRPStatsCardMini,
  IGRPStatusBanner,
  IGRPUserAvatar,
  IGRPStatsCardTopBorderColored,
} from '@igrp/igrp-framework-react-design-system';

// Stats card (dashboard KPI)
<IGRPStatsCardMini title="Revenue" value="€12,500" iconName="TrendingUp" variant="success" />

// Status banner
<IGRPStatusBanner text="System operational" badgeText="Active" color="success" />

// User avatar
<IGRPUserAvatar image={user.avatar} fallbackContent={user.initials} />
```

## References

- [stats-card.md](references/stats-card.md) – IGRPStatsCard, IGRPStatsCardMini
- [stats-card-top-border.md](references/stats-card-top-border.md) – IGRPStatsCardTopBorderColored
- [status-banner.md](references/status-banner.md) – IGRPStatusBanner
- [user-avatar.md](references/user-avatar.md) – IGRPUserAvatar

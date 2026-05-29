# Custom layer (domain-specific `IGRP*`)

A small set of pre-built domain pieces composed from Horizon. Reach for these **before** rolling your own — they encapsulate conventions used across IGRP apps.

## `IGRPUserAvatar`

```tsx
import { IGRPUserAvatar } from "@igrp/igrp-framework-react-design-system"

<IGRPUserAvatar name="Fidel da Luz" imageUrl={user.avatar} size="md" />
```

- Falls back to `igrpGetInitials(name)` when no image.
- Token-based background; consistent across the app.
- Use everywhere a user identity is shown (header, nav-user, comments, tables).

## `IGRPStatsCardMini`

Compact KPI card — number + label + optional delta. Use for at-a-glance dashboard grids where vertical space is at a premium.

```tsx
<IGRPStatsCardMini label="Utilizadores ativos" value={1284} delta="+12%" deltaTone="success" />
```

## `IGRPStatsCardTopBorderColored`

Same KPI shape with a colored top border. Use when you want to call out the status / category of the metric (e.g. red border for incidents, green for healthy services).

```tsx
<IGRPStatsCardTopBorderColored label="Incidentes" value={3} role="destructive" />
```

`role` accepts the same set as `IGRPColors` (`primary | success | destructive | warning | info`).

## `IGRPStatusBanner`

Page-top banner for system-wide status (maintenance window, degraded service, announcement). Different from `IGRPAlert` (inline) and `IGRPBanner` (marketing/announcement) — `IGRPStatusBanner` is for *operational* status with role-based color and an optional dismiss.

```tsx
<IGRPStatusBanner role="warning" title="Manutenção programada" description="Sábado, 02:00–04:00." />
```

## When to extend the Custom layer vs. inline composition

Add a new Custom component when:
1. The composition appears in 3+ places, and
2. It's domain-specific to IGRP apps (not generic enough for Horizon).

Otherwise, compose Horizon + Primitives inline at the feature site. Don't preemptively abstract.

# Custom layer

Four IGRP-specific compositions built on Horizon. **The prop names below are the real ones. They differ from what the component names suggest**, so don't guess.

`IGRPColorVariants` = `"primary" | "secondary" | "success" | "destructive" | "warning" | "info" | "indigo"`. `IGRPColorRole` = `"solid" | "outline" | "soft"`.

## `IGRPUserAvatar`

| Prop | Type | Notes |
| --- | --- | --- |
| `fallbackContent` | `ReactNode` | **Required.** It does not compute initials. Pass `igrpGetInitials(user.name)`. |
| `image` | `string \| null` | |
| `alt` | `string` | Default `"Current User"`. Pass the user's name. |
| `className`, `fallbackClass` | `string` | Size it with `className` (`size-8`). There is no `size` prop. |
| `name`, `id` | `string` | `name` becomes the DOM id. **It is not the person's name.** |

```tsx
<IGRPUserAvatar image={user.avatarUrl} alt={user.name} fallbackContent={igrpGetInitials(user.name)} className="size-8" />
```

For status dots, badges or rounded variants, use Horizon `IGRPAvatar` (`src`, `alt`, `fallback`, `scale`, `rounded`, `hasStatus`/`status`, `showBadge`/`badgeNumber`). Unlike this component, `IGRPAvatar` does derive initials from `fallback`.

## `IGRPStatsCardMini`

A compact KPI tile: a title, a coloured value and an icon.

| Prop | Type | Notes |
| --- | --- | --- |
| `title` | `string` | |
| `value` | `string \| number` | |
| `variant` | `IGRPColorVariants` = `"primary"` | Colours the value and the icon border. |
| `iconName`, `showIcon`, `iconSize` | | Pass-through from `IGRPStatsCard`. |
| `titleSize`, `valueSize`, `titleColored`, `valueColored`, `itemPlacement`, `image`, `imageAlt`, `onClick`, `*ClassName` | | Pass-through. |

The icon-background, icon-border and `iconPlacement` props type-check but **are overridden internally**, so setting them does nothing. There are no `label`, `delta` or `trend` props. Render a trend yourself next to the card.

```tsx
<IGRPStatsCardMini title="Utilizadores ativos" value={1284} variant="success" iconName="Users" />
```

## `IGRPStatsCardTopBorderColored`

A KPI card with a coloured top border. Use it when the metric's category or status should stand out.

Props: `title`, `value`, `cardVariant?: IGRPColorVariants` (default `"primary"`; colours the border and the icon), `iconName`, `className`, `iconClassName`, `name`, `id`. That's the full list: there's no `onClick` or `image`.

```tsx
<IGRPStatsCardTopBorderColored title="Incidentes" value={3} cardVariant="destructive" iconName="TriangleAlert" />
```

For anything more configurable (border position, image, click, icon background), use Horizon `IGRPStatsCard`. See `horizon.md`.

## `IGRPStatusBanner`

A one-line status strip: a dot, some text and a trailing badge, built on `IGRPAlert` + `IGRPBadge`. It has no title/description pair and can't be dismissed.

| Prop | Type / default |
| --- | --- |
| `text` | `string`. The status line. |
| `badgeText` | `string`. The badge renders only when set. |
| `variant` / `color` | `IGRPColorRole` = `"soft"` / `IGRPColorVariants` = `"success"` |
| `badgeVariant` / `badgeColor` | `"outline"` / `"primary"` |
| `className`, `name`, `id` | |

```tsx
<IGRPStatusBanner color="warning" text="Manutenção programada sábado, 02:00–04:00" badgeText="Agendado" badgeColor="warning" />
```

To show a titled, dismissible, page-level notice, use `IGRPAlert` for inline messages, or `IGRPBanner variant="announcement"` for a top bar.

## Extending this layer

Add a Custom component (in the DS, not the app) only when the composition shows up on 3 or more screens and is IGRP-domain-specific. Otherwise compose Horizon inline at the feature.

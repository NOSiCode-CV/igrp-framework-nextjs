# Utilities & hooks

All exported from the package root.

## Class merging — `cn(...)`

```ts
import { cn } from "@igrp/igrp-framework-react-design-system"

<div className={cn("rounded-md p-4", isActive && "bg-primary text-primary-foreground", className)} />
```

Wraps `clsx` + `tailwind-merge`. Always use this — never plain template-string concatenation, never `classnames` from npm.

## Token-aware color helpers — `IGRPColors`

A map of color roles × variants to ready-to-use Tailwind class strings, all using semantic tokens.

```ts
import { IGRPColors } from "@igrp/igrp-framework-react-design-system"

IGRPColors.primary.solid    // "bg-primary text-primary-foreground"
IGRPColors.primary.outline  // "border border-primary text-primary"
IGRPColors.primary.soft     // "bg-primary/10 text-primary"

IGRPColors.success.solid
IGRPColors.destructive.outline
IGRPColors.warning.soft
IGRPColors.info.solid
```

Roles: `primary | success | destructive | warning | info`. Variants: `solid | outline | soft`.

Use this when you need a status-colored pill, badge, or card surface without hand-rolling token combinations.

Related: `igrpColorText(role)` — picks a token-safe text color for a given role.

## Other lib utilities

| Export | Purpose |
| --- | --- |
| `parseLocalDate(str)` | Parse `"yyyy-mm-dd"` or `"y-m-d"` to a local-tz `Date` (avoids the UTC parsing pitfall of `new Date("2026-01-15")`). |
| `igrpGetInitials(name)` | Two-letter initials from a full name; used by `IGRPUserAvatar`. |
| `igrpToPascalCase(str)` | Convert any casing to PascalCase. |
| `igrpIsExternalUrl(url)` / `igrpNormalizeUrl(url)` | URL helpers — detect external links, prefix protocol. |
| `colorToOklch(color)` / `detectFormat(color)` | Color conversion for theming code (rarely needed in apps). |
| `igrpGridSizeClasses` | Map of `1..12` → `grid-cols-*` Tailwind classes. |
| `igrpAlertIconMappings` | Icon name per alert severity. |

## Hooks

| Hook | Purpose |
| --- | --- |
| `useIsMobile()` | `boolean` — true under the mobile breakpoint. SSR-safe. |
| `useIGRPMetaColor()` | Read/write the meta theme-color for the browser chrome (dark/light). Used by `IGRP_META_THEME_COLORS`. |
| `useIGRPFormContext()` | Strict accessor for the surrounding `IGRPForm`. Throws if used outside one. Use when writing your own form-bound widget. |

## Type exports

`IGRPFormHandle<TSchema>`, `IGRPFormProps<TSchema>`, `IGRPDataTableProps`, `IGRPMenuType` (re-exported in `next-types`), `IGRPRatioType`, `LineConfig`, `IGRPDocumentItem`, `IGRPChatMessage`, `DateRange` (re-exported from `react-day-picker`), color types (`ColorFormat`, `IGRPColorObjectVariants`, `IGRPColorObjectRole`).

## Anti-patterns

- `clsx(...)` or `classnames(...)` directly in app code — use `cn`. Direct usage misses `tailwind-merge` which is necessary for the DS's variant system.
- Hard-coded `bg-blue-500` / `text-red-600` — break theming. Use `IGRPColors.*` or a token directly.
- `new Date(localDateString)` — UTC parsing surprises. Use `parseLocalDate`.
- Custom mobile-detection hook — use `useIsMobile`.
